package schema

import (
	"time"

	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Elimination records every player removed from the game and why.
type Elimination struct {
	ent.Schema
}

func (Elimination) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New),
		field.String("game_id").
			MaxLen(12).
			NotEmpty(),
		field.UUID("round_id", uuid.UUID{}).
			Optional().
			Nillable(),
		field.UUID("player_id", uuid.UUID{}),
		field.Enum("cause").
			Values("vote", "night_kill", "moderator"),
		field.Time("eliminated_at").
			Default(time.Now).
			Immutable(),
	}
}

func (Elimination) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).
			Ref("eliminations").
			Field("game_id").
			Required().
			Unique(),
		edge.From("round", GameRound.Type).
			Ref("eliminations").
			Field("round_id").
			Unique(),
		edge.From("player", Player.Type).
			Ref("eliminations").
			Field("player_id").
			Required().
			Unique(),
	}
}

func (Elimination) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("game_id"),
		index.Fields("player_id"),
	}
}
