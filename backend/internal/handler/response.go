package handler

import (
	"encoding/json"
	"net/http"
)

// JSONResponse writes a JSON response with the given status code
func JSONResponse(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse writes an error JSON response
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	JSONResponse(w, statusCode, map[string]string{
		"error": message,
	})
}
