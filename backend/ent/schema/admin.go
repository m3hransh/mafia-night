package schema

import (
	"time"

	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Admin holds the schema definition for the Admin entity.
type Admin struct {
	ent.Schema
}

// Fields of the Admin.
func (Admin) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New),
		field.String("username").
			NotEmpty().
			MaxLen(50).
			Unique(),
		field.String("email").
			NotEmpty().
			MaxLen(100).
			Unique(),
		field.String("password_hash").
			NotEmpty().
			Sensitive(),
		field.Bool("is_active").
			Default(true),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
		field.Time("last_login").
			Optional().
			Nillable(),
	}
}

// Edges of the Admin.
func (Admin) Edges() []ent.Edge {
	return []ent.Edge{}
}

// Indexes of the Admin.
func (Admin) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("username"),
		index.Fields("email"),
	}
}
