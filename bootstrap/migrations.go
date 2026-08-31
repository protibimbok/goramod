package bootstrap

import (
	"github.com/goravel/framework/contracts/database/schema"

	"goravel/app/modular"
	"goravel/database/migrations"
)

func Migrations() []schema.Migration {
	return append([]schema.Migration{
		&migrations.M20210101000001CreateJobsTable{},
	}, modular.Migrations()...)
}
