package gameid

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerate(t *testing.T) {
	t.Run("generates 6 character ID", func(t *testing.T) {
		id := Generate()
		assert.Len(t, id, 6, "ID should be exactly 6 characters")
	})

	t.Run("generates uppercase alphanumeric only", func(t *testing.T) {
		id := Generate()
		for _, char := range id {
			assert.True(t,
				(char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9'),
				"ID should only contain A-Z and 0-9, got: %c", char)
		}
	})

	t.Run("generates random IDs", func(t *testing.T) {
		// Generate multiple IDs and ensure they're different
		ids := make(map[string]bool)
		for range 100 {
			id := Generate()
			ids[id] = true
		}
		// With 36^6 possible combinations, collisions are extremely unlikely
		assert.Greater(t, len(ids), 95, "Should generate mostly unique IDs")
	})

	t.Run("generates non-empty ID", func(t *testing.T) {
		id := Generate()
		assert.NotEmpty(t, id, "ID should not be empty")
	})
}
