package schema

import (
	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// RoleTemplateRole holds the schema definition for the RoleTemplateRole entity.
// This is a join table that connects RoleTemplate with Role and specifies the count.
type RoleTemplateRole struct {
	ent.Schema
}

// Fields of the RoleTemplateRole.
func (RoleTemplateRole) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("role_template_id", uuid.UUID{}).
			Comment("Reference to the role template"),
		field.UUID("role_id", uuid.UUID{}).
			Comment("Reference to the role"),
		field.Int("count").
			Positive().
			Comment("Number of this role in the template"),
	}
}

// Edges of the RoleTemplateRole.
func (RoleTemplateRole) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("role_template", RoleTemplate.Type).
			Ref("template_roles").
			Field("role_template_id").
			Required().
			Unique(),
		edge.From("role", Role.Type).
			Ref("template_roles").
			Field("role_id").
			Required().
			Unique(),
	}
}

// Indexes of the RoleTemplateRole.
func (RoleTemplateRole) Indexes() []ent.Index {
	return []ent.Index{
		// Ensure a role can only be added once per template
		index.Fields("role_template_id", "role_id").Unique(),
	}
}
