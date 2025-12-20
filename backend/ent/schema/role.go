package schema

import (
	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Role holds the schema definition for the Role entity.
type Role struct {
	ent.Schema
}

// Fields of the Role.
func (Role) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New),
		field.String("name").
			NotEmpty().
			MaxLen(50).
			Unique(),
		field.String("slug").
			NotEmpty().
			MaxLen(100).
			Unique(),
		field.String("video").
			NotEmpty().
			MaxLen(255),
		field.Enum("team").
			Values("mafia", "village", "independent"),
		field.Text("description").
			Optional(),
		field.JSON("abilities", []string{}).
			Optional().
			Comment("List of role abilities"),
	}
}

// Edges of the Role.
func (Role) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("game_roles", GameRole.Type),
	}
}

// Indexes of the Role.
func (Role) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("team"),
		index.Fields("slug"),
	}
}
