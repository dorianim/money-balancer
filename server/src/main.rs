// main.rs
mod guards;
mod model;
mod routes;
mod services;

use migration;
use rocket::*;
use sea_orm::*;
use sea_orm_migration::prelude::*;
use std::sync::Arc;

// Change this according to your database implementation,
// or supply it as an environment variable.
// the database URL string follows the following format:
// "protocol://username:password@host:port/database"
const DATABASE_URL: &str = "sqlite:./money-balancer.sqlite?mode=rwc";

async fn set_up_db() -> Result<DatabaseConnection, DbErr> {
    let db = Database::connect(DATABASE_URL).await?;
    let db_name = "money-balancer";
    let db = match db.get_database_backend() {
        DbBackend::MySql => {
            db.execute(Statement::from_string(
                db.get_database_backend(),
                format!("CREATE DATABASE IF NOT EXISTS `{}`;", db_name),
            ))
            .await?;
            let url = format!("{}/{}", DATABASE_URL, db_name);
            Database::connect(&url).await?
        }
        DbBackend::Postgres => {
            db.execute(Statement::from_string(
                db.get_database_backend(),
                format!("DROP DATABASE IF EXISTS \"{}\";", db_name),
            ))
            .await?;
            db.execute(Statement::from_string(
                db.get_database_backend(),
                format!("CREATE DATABASE \"{}\";", db_name),
            ))
            .await?;
            let url = format!("{}/{}", DATABASE_URL, db_name);
            Database::connect(&url).await?
        }
        DbBackend::Sqlite => db,
    };

    //let schema_manager = SchemaManager::new(&db);
    migration::Migrator::up(&db, None)
        .await
        .expect("Error applying migrations!");

    Ok(db)
}

#[get("/")]
async fn index() -> &'static str {
    "Hello, balances!"
}

#[launch] // The "main" function of the program
async fn rocket() -> _ {
    let db = Arc::new(match set_up_db().await {
        Ok(db) => db,
        Err(e) => panic!("{}", e),
    });

    let user_service = services::user::UserService::new(db.clone());
    let group_service = services::group::GroupService::new(db);

    rocket::build()
        .manage(user_service)
        .manage(group_service)
        .mount("/", routes![index])
        .mount("/user", routes::user::routes())
        .mount("/group", routes::group::routes())
}
