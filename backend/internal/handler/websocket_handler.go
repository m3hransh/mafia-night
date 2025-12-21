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

// isConnectionClosed checks if an error is due to a closed connection
func isConnectionClosed(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return websocket.IsCloseError(err, websocket.CloseAbnormalClosure, websocket.CloseGoingAway, websocket.CloseNormalClosure) ||
		errStr == "use of closed network connection" ||
		errStr == "write tcp: use of closed network connection" ||
		errStr == "read tcp: use of closed network connection"
}

type GameUpdateType string

const (
	PlayerJoined    GameUpdateType = "player_joined"
	PlayerLeft      GameUpdateType = "player_left"
	RolesDistributed GameUpdateType = "roles_distributed"
	GameDeleted     GameUpdateType = "game_deleted"
)

type GameUpdate struct {
	Type    GameUpdateType `json:"type"`
	GameID  string         `json:"game_id"`
	Payload interface{}    `json:"payload,omitempty"`
}

type WebSocketHub struct {
	gameService      *service.GameService
	clients          map[string]map[*websocket.Conn]*clientInfo // gameID -> connections with metadata
	broadcast        chan GameUpdate
	register         chan *clientSubscription
	unregister       chan *clientSubscription
	mu               sync.RWMutex
	totalConnections int64 // atomic counter for total connections
}

type clientInfo struct {
	connectedAt time.Time
	remoteAddr  string
}

type clientSubscription struct {
	gameID     string
	conn       *websocket.Conn
	remoteAddr string
}

func NewWebSocketHub(gameService *service.GameService) *WebSocketHub {
	hub := &WebSocketHub{
		gameService:      gameService,
		clients:          make(map[string]map[*websocket.Conn]*clientInfo),
		broadcast:        make(chan GameUpdate, 256),
		register:         make(chan *clientSubscription),
		unregister:       make(chan *clientSubscription),
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
		case sub := <-h.register:
			h.mu.Lock()

			// Check total connection limit
			currentTotal := atomic.LoadInt64(&h.totalConnections)
			if currentTotal >= maxTotalConnections {
				h.mu.Unlock()
				log.Printf("[WebSocket] Connection limit reached (%d), rejecting new connection from %s for game %s",
					maxTotalConnections, sub.remoteAddr, sub.gameID)
				sub.conn.Close()
				continue
			}

			// Check per-game connection limit
			if h.clients[sub.gameID] == nil {
				h.clients[sub.gameID] = make(map[*websocket.Conn]*clientInfo)
			} else if len(h.clients[sub.gameID]) >= maxConnectionsPerGame {
				h.mu.Unlock()
				log.Printf("[WebSocket] Game connection limit reached (%d) for game %s, rejecting connection from %s",
					maxConnectionsPerGame, sub.gameID, sub.remoteAddr)
				sub.conn.Close()
				continue
			}

			// Register the connection
			h.clients[sub.gameID][sub.conn] = &clientInfo{
				connectedAt: time.Now(),
				remoteAddr:  sub.remoteAddr,
			}
			atomic.AddInt64(&h.totalConnections, 1)

			totalConns := atomic.LoadInt64(&h.totalConnections)
			gameConns := len(h.clients[sub.gameID])

			log.Printf("[WebSocket] Client connected: game=%s, addr=%s, gameConns=%d, totalConns=%d",
				sub.gameID, sub.remoteAddr, gameConns, totalConns)

			h.mu.Unlock()

		case sub := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[sub.gameID]; ok {
				if info, ok := clients[sub.conn]; ok {
					duration := time.Since(info.connectedAt)
					delete(clients, sub.conn)
					atomic.AddInt64(&h.totalConnections, -1)

					// Close the connection (ignore error if already closed)
					sub.conn.Close()

					totalConns := atomic.LoadInt64(&h.totalConnections)
					gameConns := len(clients)

					log.Printf("[WebSocket] Client disconnected: game=%s, addr=%s, duration=%v, gameConns=%d, totalConns=%d",
						sub.gameID, info.remoteAddr, duration, gameConns, totalConns)

					// Clean up empty game entries
					if len(clients) == 0 {
						delete(h.clients, sub.gameID)
						log.Printf("[WebSocket] Game %s has no more connections, cleaning up", sub.gameID)
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

			successCount := 0
			failCount := 0

			for conn, info := range clients {
				conn.SetWriteDeadline(time.Now().Add(writeWait))
				err := conn.WriteJSON(update)
				if err != nil {
					failCount++
					log.Printf("[WebSocket] Write error for game %s, client %s: %v", update.GameID, info.remoteAddr, err)
					// Unregister failed connection
					go func(c *websocket.Conn, addr string) {
						h.unregister <- &clientSubscription{gameID: update.GameID, conn: c, remoteAddr: addr}
					}(conn, info.remoteAddr)
				} else {
					successCount++
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

	// Configure connection limits and handlers BEFORE registering
	conn.SetReadLimit(maxMessageSize)
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	sub := &clientSubscription{
		gameID:     gameID,
		conn:       conn,
		remoteAddr: remoteAddr,
	}

	// Register the connection (this may reject if limits are exceeded)
	h.register <- sub

	// Wait a bit to ensure registration completed or was rejected
	// If rejected, the connection will be closed by the hub
	time.Sleep(10 * time.Millisecond)

	// Check if connection is still alive before sending initial state
	if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
		// Connection was rejected or closed
		log.Printf("[WebSocket] Connection rejected/closed before initial state for game %s, addr %s", gameID, remoteAddr)
		return
	}

	// Send initial game state
	// Use context.Background() instead of r.Context() because the HTTP request context
	// is cancelled after the WebSocket upgrade, but we need the context to remain valid
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
			conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteJSON(GameUpdate{
				Type:    "initial_state",
				GameID:  gameID,
				Payload: map[string]interface{}{"players": playersJSON},
			}); err != nil {
				// Only log if it's not a "connection closed" error
				if !isConnectionClosed(err) {
					log.Printf("[WebSocket] Error sending initial state for game %s, addr %s: %v", gameID, remoteAddr, err)
				}
			} else {
				log.Printf("[WebSocket] Sent initial state to game %s, addr %s: %d players", gameID, remoteAddr, len(players))
			}
		} else {
			log.Printf("[WebSocket] Error fetching initial players for game %s: %v", gameID, err)
		}
	}()

	// Start ping ticker
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		h.unregister <- sub
		log.Printf("[WebSocket] Connection handler exiting for game %s, addr %s", gameID, remoteAddr)
	}()

	// Start goroutine to send pings
	go func() {
		for {
			select {
			case <-ticker.C:
				conn.SetWriteDeadline(time.Now().Add(writeWait))
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					log.Printf("[WebSocket] Ping failed for game %s, addr %s: %v", gameID, remoteAddr, err)
					return
				}
			}
		}
	}()

	// Read messages (primarily to detect disconnection and handle pong)
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNormalClosure) {
				log.Printf("[WebSocket] Unexpected close error for game %s, addr %s: %v", gameID, remoteAddr, err)
			} else {
				log.Printf("[WebSocket] Connection closed for game %s, addr %s: %v", gameID, remoteAddr, err)
			}
			break
		}

		// Log received messages for debugging (optional - can be removed in production)
		if messageType == websocket.TextMessage || messageType == websocket.BinaryMessage {
			log.Printf("[WebSocket] Received message from game %s, addr %s: type=%d, len=%d", gameID, remoteAddr, messageType, len(message))
		}
	}
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
