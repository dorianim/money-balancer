// main.rs
mod guards;
mod model;
mod routes;
mod schema;

use rocket::*;
use routes::balance::routes;
use sea_orm::*;
use sea_orm_migration::prelude::*;

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
    schema::Migrator::up(&db, None)
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
    let db = match set_up_db().await {
        Ok(db) => db,
        Err(e) => panic!("{}", e),
    };

    rocket::build()
        .manage(db)
        .mount("/", routes![index])
        .mount("/user", routes::user::routes())
        .mount("/balance", routes::balance::routes())
}
