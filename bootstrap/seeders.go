package bootstrap

import (
	"goravel/app/modular"

	"github.com/goravel/framework/contracts/database/seeder"
)

func Seeders() []seeder.Seeder {
	return modular.Seeders()
}
