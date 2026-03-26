package schema

import (
	"time"

	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// GameRound tracks each day or night phase within a game.
type GameRound struct {
	ent.Schema
}

func (GameRound) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New),
		field.String("game_id").
			MaxLen(12).
			NotEmpty(),
		field.Int("round_number").
			NonNegative(),
		field.Enum("phase").
			Values("day", "night"),
		field.Time("started_at").
			Default(time.Now).
			Immutable(),
		field.Time("ended_at").
			Optional().
			Nillable(),
	}
}

func (GameRound) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).
			Ref("rounds").
			Field("game_id").
			Required().
			Unique(),
		edge.To("eliminations", Elimination.Type),
		edge.To("votes", Vote.Type),
	}
}

func (GameRound) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("game_id", "round_number"),
	}
}
