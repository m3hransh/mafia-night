package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Vote represents one player's vote against another during a day round.
type Vote struct{ ent.Schema }

func (Vote) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("game_id").MaxLen(12).NotEmpty(),
		field.UUID("round_id", uuid.UUID{}),
		field.UUID("voter_id", uuid.UUID{}),
		field.UUID("target_id", uuid.UUID{}),
		field.Enum("stage").Values("nomination", "final"),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Vote) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).Ref("votes").Field("game_id").Required().Unique(),
		edge.From("round", GameRound.Type).Ref("votes").Field("round_id").Required().Unique(),
		edge.From("voter", Player.Type).Ref("cast_votes").Field("voter_id").Required().Unique(),
		edge.From("target", Player.Type).Ref("received_votes").Field("target_id").Required().Unique(),
	}
}

func (Vote) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("round_id", "voter_id", "stage").Unique(),
		index.Fields("game_id"),
	}
}


