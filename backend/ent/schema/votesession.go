package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// VoteSession is one moderator-opened vote against a specific player.
type VoteSession struct{ ent.Schema }

func (VoteSession) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.String("game_id").MaxLen(12).NotEmpty(),
		field.UUID("accused_player_id", uuid.UUID{}),
		field.String("accused_player_name").NotEmpty(),
		field.String("message").Optional().Default(""),
		field.Enum("status").Values("open", "closed").Default("open"),
		field.Time("opened_at").Default(time.Now).Immutable(),
		field.Time("closed_at").Optional().Nillable(),
	}
}

func (VoteSession) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("game", Game.Type).
			Ref("vote_sessions").
			Field("game_id").
			Required().
			Unique(),
		edge.To("ballots", Ballot.Type).
			Annotations(entsql.OnDelete(entsql.Cascade)),
	}
}

func (VoteSession) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("game_id", "status"),
	}
}
