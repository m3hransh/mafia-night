package schema

import (
	"time"

	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// GameRole holds the schema definition for the GameRole entity.
type GameRole struct {
	ent.Schema
}

// Fields of the GameRole.
func (GameRole) Fields() []ent.Field {
	return []ent.Field{
		field.String("game_id").
			MaxLen(12).
			NotEmpty(),
		field.UUID("player_id", uuid.UUID{}),
		field.UUID("role_id", uuid.UUID{}),
		field.Time("assigned_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the GameRole.
func (GameRole) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).
			Ref("game_roles").
			Field("game_id").
			Required().
			Unique(),
		edge.From("player", Player.Type).
			Ref("game_role").
			Field("player_id").
			Required().
			Unique(),
		edge.From("role", Role.Type).
			Ref("game_roles").
			Field("role_id").
			Required().
			Unique(),
	}
}

// Indexes of the GameRole.
func (GameRole) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("game_id", "player_id").Unique(),
	}
}
