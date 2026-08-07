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

#[options("/<_..>")]
fn options() {}

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

#[cfg(test)]
pub async fn build_test_rocket() -> Rocket<Build> {
    static SET_TEST_SECRET: std::sync::Once = std::sync::Once::new();
    SET_TEST_SECRET.call_once(|| {
        std::env::set_var("MONEYBALANCER_JWT_SECRET", "test-secret");
    });

    let mut options = ConnectOptions::new("sqlite::memory:".to_owned());
    options.max_connections(1);
    let db = Database::connect(options)
        .await
        .expect("Error creating test database!");

    migration::Migrator::fresh(&db)
        .await
        .expect("Error creating fresh test db!");

    build_rocket(db)
}

pub fn build_rocket(db: DatabaseConnection) -> Rocket<Build> {
    let db = Arc::new(db);
    let configuration_service = Arc::new(services::configuration::ConfigurationService::new());

    let user_service = Arc::new(services::user::UserService::new(db.clone()));
    let group_service = services::group::GroupService::new(db.clone());

    let authentication_service = Arc::new(services::authentication::AuthenticationService::new(
        configuration_service.clone(),
        user_service.clone(),
    ));

    rocket::build()
        .attach(fairings::cors::CORS)
        .manage(configuration_service)
        .manage(authentication_service)
        .manage(user_service)
        .manage(group_service)
        .mount("/", routes![options])
        .mount("/", routes::client::routes())
        .mount("/api/v1", routes::swagger::routes())
        .mount("/api/v1/user", routes::user::routes())
        .mount("/api/v1/group", routes::group::routes())
        .mount("/api/v1/auth", routes::auth::routes())
}
