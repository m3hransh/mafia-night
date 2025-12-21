package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
	"github.com/mafia-night/backend/internal/service"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now (controlled by CORS middleware)
	},
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
	gameService *service.GameService
	clients     map[string]map[*websocket.Conn]bool // gameID -> connections
	broadcast   chan GameUpdate
	register    chan *clientSubscription
	unregister  chan *clientSubscription
	mu          sync.RWMutex
}

type clientSubscription struct {
	gameID string
	conn   *websocket.Conn
}

func NewWebSocketHub(gameService *service.GameService) *WebSocketHub {
	hub := &WebSocketHub{
		gameService: gameService,
		clients:     make(map[string]map[*websocket.Conn]bool),
		broadcast:   make(chan GameUpdate, 256),
		register:    make(chan *clientSubscription),
		unregister:  make(chan *clientSubscription),
	}
	go hub.run()
	return hub
}

func (h *WebSocketHub) run() {
	for {
		select {
		case sub := <-h.register:
			h.mu.Lock()
			if h.clients[sub.gameID] == nil {
				h.clients[sub.gameID] = make(map[*websocket.Conn]bool)
			}
			h.clients[sub.gameID][sub.conn] = true
			h.mu.Unlock()

		case sub := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[sub.gameID]; ok {
				if _, ok := clients[sub.conn]; ok {
					delete(clients, sub.conn)
					sub.conn.Close()
					if len(clients) == 0 {
						delete(h.clients, sub.gameID)
					}
				}
			}
			h.mu.Unlock()

		case update := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[update.GameID]
			h.mu.RUnlock()

			for conn := range clients {
				err := conn.WriteJSON(update)
				if err != nil {
					log.Printf("WebSocket write error: %v", err)
					h.unregister <- &clientSubscription{gameID: update.GameID, conn: conn}
				}
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

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	sub := &clientSubscription{
		gameID: gameID,
		conn:   conn,
	}

	h.register <- sub

	// Send initial game state
	go func() {
		players, err := h.gameService.GetPlayers(r.Context(), gameID)
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
			conn.WriteJSON(GameUpdate{
				Type:    "initial_state",
				GameID:  gameID,
				Payload: map[string]interface{}{"players": playersJSON},
			})
		}
	}()

	// Keep connection alive and handle cleanup
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			h.unregister <- sub
			break
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
