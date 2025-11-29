package schema

import "entgo.io/ent"

// GameRole holds the schema definition for the GameRole entity.
type GameRole struct {
	ent.Schema
}

// Fields of the GameRole.
func (GameRole) Fields() []ent.Field {
	return nil
}

// Edges of the GameRole.
func (GameRole) Edges() []ent.Edge {
	return nil
}
