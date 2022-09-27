// main.rs
mod fairings;
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

async fn set_up_db(url: &str) -> Result<DatabaseConnection, DbErr> {
    let db = Database::connect(url).await?;
    let db_name = "money-balancer";
    let db = match db.get_database_backend() {
        DbBackend::MySql => {
            db.execute(Statement::from_string(
                db.get_database_backend(),
                format!("CREATE DATABASE IF NOT EXISTS `{}`;", db_name),
            ))
            .await?;
            let url = format!("{}/{}", url, db_name);
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
            let url = format!("{}/{}", url, db_name);
            Database::connect(&url).await?
        }
        DbBackend::Sqlite => db,
    };

    Ok(db)
}

#[launch] // The "main" function of the program
async fn rocket() -> _ {
    let db = match set_up_db(DATABASE_URL).await {
        Ok(db) => db,
        Err(e) => panic!("{}", e),
    };

    migration::Migrator::up(&db, None)
        .await
        .expect("Error applying migrations!");

    build_rocket(db)
}

pub fn build_test_rocket() -> Rocket<Build> {
    std::fs::remove_file("./.money-balancer-test-tmp.sqlite").expect("");

    let db = match futures::executor::block_on(set_up_db(
        "sqlite:./.money-balancer-test-tmp.sqlite?mode=rwc",
    )) {
        Ok(db) => db,
        Err(e) => panic!("{}", e),
    };

    futures::executor::block_on(migration::Migrator::fresh(&db))
        .expect("Error creating fresh test db!");

    build_rocket(db)
}

pub fn build_rocket(db: DatabaseConnection) -> Rocket<Build> {
    let db = Arc::new(db);
    let user_service = services::user::UserService::new(db.clone());
    let group_service = services::group::GroupService::new(db);

    rocket::build()
        .attach(fairings::cors::CORS)
        .manage(user_service)
        .manage(group_service)
        .mount("/", routes::client::routes())
        .mount("/api/v1", routes::swagger::routes())
        .mount("/api/v1/user", routes::user::routes())
        .mount("/api/v1/group", routes::group::routes())
}
