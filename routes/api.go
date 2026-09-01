package routes

import (
	"strings"

	"goravel/app/facades"
	"goravel/app/modular"

	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/contracts/route"
)

func Api() {
	facades.Route().
		Prefix("/api").
		Group(func(router route.Router) {
			modular.ApiRoutes(router)
		})
}

func ApiFallback(ctx http.Context) http.Response {
	path := ctx.Request().Path()
	if path == "/api" || strings.HasPrefix(path, "/api/") {
		return ctx.Response().Json(http.StatusNotFound, http.Json{
			"message": "Not Found",
		})
	}

	return nil
}
