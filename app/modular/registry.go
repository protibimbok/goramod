package modular

import (
	"fmt"

	"github.com/goravel/framework/contracts/console"
	"github.com/goravel/framework/contracts/database/schema"
	"github.com/goravel/framework/contracts/database/seeder"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/contracts/route"
)

type Registry struct {
	modules []Module
	names   map[string]bool
	sorted  []Module
}

func NewRegistry() *Registry {
	return &Registry{
		names: make(map[string]bool),
	}
}

func (r *Registry) Register(modules ...Module) {
	for _, module := range modules {
		if _, ok := r.names[module.Name()]; ok {
			panic(fmt.Sprintf("modular: duplicate module %q", module.Name()))
		}
		r.modules = append(r.modules, module)
		r.names[module.Name()] = true
	}
}

func (r *Registry) All() []Module {
	if r.sorted == nil {
		r.sorted = sortOrderable(r.modules)
	}
	return r.sorted
}

func (r *Registry) ApiRoutes(router route.Router) {
	for _, module := range r.All() {
		if provider, ok := module.(ApiRouteProvider); ok {
			provider.ApiRoutes(router)
		}
	}
}

func (r *Registry) Routes(router route.Router) {
	for _, module := range r.All() {
		if provider, ok := module.(RouteProvider); ok {
			provider.Routes(router)
		}
	}
}

func (r *Registry) GlobalMiddlewares() []http.Middleware {
	var middlewares []http.Middleware
	for _, module := range r.All() {
		if provider, ok := module.(GlobalMiddlewareProvider); ok {
			middlewares = append(middlewares, provider.GlobalMiddlewares()...)
		}
	}
	return middlewares
}

func (r *Registry) Migrations() []schema.Migration {
	var migrations []schema.Migration
	for _, module := range r.All() {
		if provider, ok := module.(MigrationProvider); ok {
			migrations = append(migrations, provider.Migrations()...)
		}
	}
	return migrations
}

func (r *Registry) Seeders() []seeder.Seeder {
	var seeders []seeder.Seeder
	for _, module := range r.All() {
		if provider, ok := module.(SeederProvider); ok {
			seeders = append(seeders, provider.Seeders()...)
		}
	}
	return seeders
}

func (r *Registry) Commands() []console.Command {
	var commands []console.Command
	for _, module := range r.All() {
		if provider, ok := module.(CommandProvider); ok {
			commands = append(commands, provider.Commands()...)
		}
	}
	return commands
}
