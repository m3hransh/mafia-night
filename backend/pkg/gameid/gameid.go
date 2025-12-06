package gameid

import (
	"math/rand/v2"
	"strings"
)

const (
	idLength = 6
	charset  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

// Generate creates a random 6-character game ID
// Format: ABCDEF (uppercase letters and numbers)
func Generate() string {
	var sb strings.Builder
	sb.Grow(idLength)
	
	for i := 0; i < idLength; i++ {
		randomIndex := rand.IntN(len(charset))
		sb.WriteByte(charset[randomIndex])
	}
	
	return sb.String()
}
