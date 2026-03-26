package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// Ballot is one player's yes/no vote within a VoteSession.
type Ballot struct{ ent.Schema }

func (Ballot) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New),
		field.UUID("session_id", uuid.UUID{}),
		field.UUID("voter_id", uuid.UUID{}),
		field.Enum("choice").Values("yes", "no"),
		field.Time("created_at").Default(time.Now).Immutable(),
	}
}

func (Ballot) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("session", VoteSession.Type).
			Ref("ballots").
			Field("session_id").
			Required().
			Unique(),
	}
}

func (Ballot) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("session_id", "voter_id").Unique(),
	}
}
