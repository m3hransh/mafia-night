package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/mafia-night/backend/internal/service"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512

	// Maximum connections per game (increased for e2e tests)
	maxConnectionsPerGame = 200

	// Maximum total connections across all games
	maxTotalConnections = 2000
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now (controlled by CORS middleware)
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub         *WebSocketHub
	conn        *websocket.Conn
	send        chan []byte
	gameID      string
	remoteAddr  string
	connectedAt time.Time
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Unexpected close error: %v", err)
			}
			break
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

type GameUpdateType string

const (
	PlayerJoined     GameUpdateType = "player_joined"
	PlayerLeft       GameUpdateType = "player_left"
	RolesDistributed GameUpdateType = "roles_distributed"
	GameDeleted      GameUpdateType = "game_deleted"
)

type GameUpdate struct {
	Type    GameUpdateType `json:"type"`
	GameID  string         `json:"game_id"`
	Payload interface{}    `json:"payload,omitempty"`
}

type WebSocketHub struct {
	gameService      *service.GameService
	clients          map[string]map[*Client]bool // gameID -> clients
	broadcast        chan GameUpdate
	register         chan *Client
	unregister       chan *Client
	mu               sync.RWMutex
	totalConnections int64 // atomic counter for total connections
}

func NewWebSocketHub(gameService *service.GameService) *WebSocketHub {
	hub := &WebSocketHub{
		gameService:      gameService,
		clients:          make(map[string]map[*Client]bool),
		broadcast:        make(chan GameUpdate, 256),
		register:         make(chan *Client),
		unregister:       make(chan *Client),
		totalConnections: 0,
	}
	go hub.run()

	// Start periodic logging of connection stats
	go hub.logConnectionStats()

	return hub
}

// logConnectionStats logs WebSocket connection statistics periodically
func (h *WebSocketHub) logConnectionStats() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.RLock()
		totalConns := atomic.LoadInt64(&h.totalConnections)
		gameCount := len(h.clients)

		if totalConns > 0 {
			log.Printf("[WebSocket Stats] Total connections: %d, Active games: %d", totalConns, gameCount)

			// Log per-game stats
			for gameID, clients := range h.clients {
				log.Printf("[WebSocket Stats] Game %s: %d connections", gameID, len(clients))
			}
		}
		h.mu.RUnlock()
	}
}

// GetConnectionStats returns current connection statistics
func (h *WebSocketHub) GetConnectionStats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	totalConns := atomic.LoadInt64(&h.totalConnections)
	gameStats := make(map[string]int)

	for gameID, clients := range h.clients {
		gameStats[gameID] = len(clients)
	}

	return map[string]interface{}{
		"total_connections": totalConns,
		"active_games":      len(h.clients),
		"games":             gameStats,
	}
}

func (h *WebSocketHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()

			// Check total connection limit
			currentTotal := atomic.LoadInt64(&h.totalConnections)
			if currentTotal >= maxTotalConnections {
				h.mu.Unlock()
				log.Printf("[WebSocket] Connection limit reached (%d), rejecting new connection from %s for game %s",
					maxTotalConnections, client.remoteAddr, client.gameID)
				client.conn.Close()
				continue
			}

			// Check per-game connection limit
			if h.clients[client.gameID] == nil {
				h.clients[client.gameID] = make(map[*Client]bool)
			} else if len(h.clients[client.gameID]) >= maxConnectionsPerGame {
				h.mu.Unlock()
				log.Printf("[WebSocket] Game connection limit reached (%d) for game %s, rejecting connection from %s",
					maxConnectionsPerGame, client.gameID, client.remoteAddr)
				client.conn.Close()
				continue
			}

			// Register the connection
			h.clients[client.gameID][client] = true
			atomic.AddInt64(&h.totalConnections, 1)

			totalConns := atomic.LoadInt64(&h.totalConnections)
			gameConns := len(h.clients[client.gameID])

			log.Printf("[WebSocket] Client connected: game=%s, addr=%s, gameConns=%d, totalConns=%d",
				client.gameID, client.remoteAddr, gameConns, totalConns)

			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.gameID]; ok {
				if _, ok := clients[client]; ok {
					duration := time.Since(client.connectedAt)
					delete(clients, client)
					close(client.send)
					atomic.AddInt64(&h.totalConnections, -1)

					totalConns := atomic.LoadInt64(&h.totalConnections)
					gameConns := len(clients)

					log.Printf("[WebSocket] Client disconnected: game=%s, addr=%s, duration=%v, gameConns=%d, totalConns=%d",
						client.gameID, client.remoteAddr, duration, gameConns, totalConns)

					// Clean up empty game entries
					if len(clients) == 0 {
						delete(h.clients, client.gameID)
						log.Printf("[WebSocket] Game %s has no more connections, cleaning up", client.gameID)
					}
				}
			}
			h.mu.Unlock()

		case update := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[update.GameID]
			h.mu.RUnlock()

			if len(clients) == 0 {
				continue
			}

			// Marshal once
			message, err := json.Marshal(update)
			if err != nil {
				log.Printf("[WebSocket] Error marshaling update: %v", err)
				continue
			}

			successCount := 0
			failCount := 0

			for client := range clients {
				select {
				case client.send <- message:
					successCount++
				default:
					failCount++
					close(client.send)
					delete(clients, client)
				}
			}

			if failCount > 0 || successCount > 0 {
				log.Printf("[WebSocket] Broadcast %s to game %s: success=%d, failed=%d",
					update.Type, update.GameID, successCount, failCount)
			}
		}
	}
}

func (h *WebSocketHub) BroadcastToGame(gameID string, updateType GameUpdateType, payload interface{}) {
	h.broadcast <- GameUpdate{
		Type:    updateType,
		GameID:  gameID,
		Payload: payload,
	}
}

func (h *WebSocketHub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "id")
	if gameID == "" {
		http.Error(w, "game ID required", http.StatusBadRequest)
		return
	}

	// Get remote address for logging
	remoteAddr := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		remoteAddr = forwarded
	}

	log.Printf("[WebSocket] Upgrade request: game=%s, addr=%s", gameID, remoteAddr)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade error for game %s, addr %s: %v", gameID, remoteAddr, err)
		return
	}

	client := &Client{
		hub:         h,
		conn:        conn,
		send:        make(chan []byte, 256),
		gameID:      gameID,
		remoteAddr:  remoteAddr,
		connectedAt: time.Now(),
	}

	// Register the connection
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()

	// Send initial game state
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		players, err := h.gameService.GetPlayers(ctx, gameID)
		if err == nil {
			playersJSON := make([]map[string]any, len(players))
			for i, player := range players {
				playersJSON[i] = map[string]any{
					"id":         player.ID,
					"name":       player.Name,
					"game_id":    player.GameID,
					"created_at": player.CreatedAt,
				}
			}
			
			update := GameUpdate{
				Type:    "initial_state",
				GameID:  gameID,
				Payload: map[string]interface{}{"players": playersJSON},
			}
			
			if msg, err := json.Marshal(update); err == nil {
				select {
				case client.send <- msg:
					log.Printf("[WebSocket] Sent initial state to game %s, addr %s: %d players", gameID, remoteAddr, len(players))
				default:
					log.Printf("[WebSocket] Failed to send initial state (buffer full)")
				}
			}
		} else {
			log.Printf("[WebSocket] Error fetching initial players for game %s: %v", gameID, err)
		}
	}()
}

type WebSocketHandler struct {
	hub         *WebSocketHub
	gameService *service.GameService
}

func NewWebSocketHandler(gameService *service.GameService) *WebSocketHandler {
	return &WebSocketHandler{
		hub:         NewWebSocketHub(gameService),
		gameService: gameService,
	}
}

func (h *WebSocketHandler) GetHub() *WebSocketHub {
	return h.hub
}

func (h *WebSocketHandler) HandleGameWebSocket(w http.ResponseWriter, r *http.Request) {
	h.hub.HandleWebSocket(w, r)
}

// HandleWebSocketStats returns current WebSocket connection statistics
func (h *WebSocketHandler) HandleWebSocketStats(w http.ResponseWriter, r *http.Request) {
	stats := h.hub.GetConnectionStats()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}

// BroadcastPlayerJoined sends a player joined update to all clients
func (h *WebSocketHandler) BroadcastPlayerJoined(gameID string, player map[string]any) {
	h.hub.BroadcastToGame(gameID, PlayerJoined, player)
}

// BroadcastPlayerLeft sends a player left update to all clients
func (h *WebSocketHandler) BroadcastPlayerLeft(gameID string, playerID string) {
	h.hub.BroadcastToGame(gameID, PlayerLeft, map[string]string{"player_id": playerID})
}

// BroadcastRolesDistributed sends a roles distributed update
func (h *WebSocketHandler) BroadcastRolesDistributed(gameID string) {
	h.hub.BroadcastToGame(gameID, RolesDistributed, nil)
}

// BroadcastGameDeleted sends a game deleted update
func (h *WebSocketHandler) BroadcastGameDeleted(gameID string) {
	h.hub.BroadcastToGame(gameID, GameDeleted, nil)
}

// NotifyPlayerUpdate wraps game handler methods to send WebSocket updates
func NotifyPlayerUpdate(handler http.HandlerFunc, wsHandler *WebSocketHandler, updateType GameUpdateType) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		gameID := chi.URLParam(r, "id")

		// Capture response
		rec := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}
		handler(rec, r)

		// If successful, broadcast update
		if rec.statusCode < 400 && gameID != "" {
			switch updateType {
			case PlayerJoined:
				if rec.body != nil {
					var player map[string]any
					if err := json.Unmarshal(rec.body, &player); err == nil {
						wsHandler.BroadcastPlayerJoined(gameID, player)
					}
				}
			case PlayerLeft:
				playerID := chi.URLParam(r, "player_id")
				wsHandler.BroadcastPlayerLeft(gameID, playerID)
			case RolesDistributed:
				wsHandler.BroadcastRolesDistributed(gameID)
			case GameDeleted:
				wsHandler.BroadcastGameDeleted(gameID)
			}
		}
	}
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body = append(r.body, b...)
	return r.ResponseWriter.Write(b)
}
