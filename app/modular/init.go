package modular

import (
	"github.com/goravel/framework/contracts/console"
	"github.com/goravel/framework/contracts/database/schema"
	"github.com/goravel/framework/contracts/database/seeder"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/contracts/route"
)

// Default is the registry the application boots with.
var Default = NewRegistry()

func Register(modules ...Module)           { Default.Register(modules...) }
func ApiRoutes(router route.Router)        { Default.ApiRoutes(router) }
func Routes(router route.Router)           { Default.Routes(router) }
func GlobalMiddlewares() []http.Middleware { return Default.GlobalMiddlewares() }
func Migrations() []schema.Migration       { return Default.Migrations() }
func Seeders() []seeder.Seeder             { return Default.Seeders() }
func Commands() []console.Command          { return Default.Commands() }
