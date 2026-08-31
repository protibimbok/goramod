package routes

import (
	"goravel/app/facades"
	"goravel/app/modular"

	"github.com/goravel/framework/contracts/route"
)

func Api() {
	facades.Route().
		Prefix("/api").
		Group(func(router route.Router) {
			modular.ApiRoutes(router)
		})
}
