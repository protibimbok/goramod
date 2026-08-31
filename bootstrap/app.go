package bootstrap

import (
	contractsfoundation "github.com/goravel/framework/contracts/foundation"
	"github.com/goravel/framework/contracts/foundation/configuration"
	"github.com/goravel/framework/foundation"

	"goravel/app/modular"
	"goravel/config"
	"goravel/modules"
	"goravel/routes"
)

func Boot() contractsfoundation.Application {
	modules.Boot()
	return foundation.Setup().
		WithMiddleware(func(middleware configuration.Middleware) {
			middleware.Append(modular.GlobalMiddlewares()...)
		}).
		WithMigrations(Migrations).
		WithSeeders(Seeders).
		WithCommands(Commands).
		WithRouting(func() {
			routes.Api()
			routes.Web()
			routes.Grpc()
		}).
		WithProviders(Providers).
		WithConfig(config.Boot).
		Create()
}
