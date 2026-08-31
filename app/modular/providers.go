package modular

import (
	"github.com/goravel/framework/contracts/console"
	"github.com/goravel/framework/contracts/database/schema"
	"github.com/goravel/framework/contracts/database/seeder"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/contracts/route"
)

type Module interface {
	Name() string
}

type ApiRouteProvider interface {
	ApiRoutes(router route.Router)
}

type RouteProvider interface {
	Routes(router route.Router)
}

type GlobalMiddlewareProvider interface {
	GlobalMiddlewares() []http.Middleware
}

type MigrationProvider interface {
	Migrations() []schema.Migration
}

type SeederProvider interface {
	Seeders() []seeder.Seeder
}

type CommandProvider interface {
	Commands() []console.Command
}
