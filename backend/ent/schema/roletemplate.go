package schema

import (
	"time"

	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// RoleTemplate holds the schema definition for the RoleTemplate entity.
type RoleTemplate struct {
	ent.Schema
}

// Fields of the RoleTemplate.
func (RoleTemplate) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New),
		field.String("name").
			NotEmpty().
			MaxLen(100).
			Unique().
			Comment("Name of the role template"),
		field.Int("player_count").
			Positive().
			Comment("Total number of players this template is designed for"),
		field.Text("description").
			Optional().
			Comment("Description of the template and its gameplay style"),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

// Edges of the RoleTemplate.
func (RoleTemplate) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("template_roles", RoleTemplateRole.Type),
	}
}

// Indexes of the RoleTemplate.
func (RoleTemplate) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("player_count"),
		index.Fields("name"),
	}
}
