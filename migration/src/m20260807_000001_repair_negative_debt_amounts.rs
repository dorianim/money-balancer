use sea_orm_migration::{
    prelude::*,
    sea_orm::{ConnectionTrait, Statement},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Older releases converted the unsigned request amount to i32 before
        // writing it. Reinterpret those wrapped values as their original u32.
        manager
            .get_connection()
            .execute(Statement::from_string(
                manager.get_database_backend(),
                "UPDATE debt SET amount = amount + 4294967296 WHERE amount < 0".to_owned(),
            ))
            .await?;
        Ok(())
    }

    async fn down(&self, _manager: &SchemaManager) -> Result<(), DbErr> {
        // This is an irreversible data repair: converting valid large values
        // back to their old wrapped representation would corrupt new rows.
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Migrator;
    use sea_orm_migration::sea_orm::Database;

    #[async_std::test]
    async fn repairs_amounts_wrapped_by_the_old_i32_write_path() -> Result<(), DbErr> {
        let db = Database::connect("sqlite::memory:").await?;
        Migrator::up(&db, Some(5)).await?;

        db.execute(Statement::from_string(
            db.get_database_backend(),
            "INSERT INTO user (id, username, nickname, password) \
             VALUES ('debtor', 'debtor', 'Debtor', 'unused'); \
             INSERT INTO user (id, username, nickname, password) \
             VALUES ('creditor', 'creditor', 'Creditor', 'unused'); \
             INSERT INTO 'group' (id, name) VALUES ('group', 'Group'); \
             INSERT INTO 'transaction' \
                 (id, group_id, creditor_id, timestamp, description) \
             VALUES ('transaction', 'group', 'creditor', 0, 'legacy row'); \
             INSERT INTO debt \
                 (transaction_id, debtor_id, amount, was_split_unequally) \
             VALUES ('transaction', 'debtor', -2147483648, 0)"
                .to_owned(),
        ))
        .await?;

        Migrator::up(&db, None).await?;
        let row = db
            .query_one(Statement::from_string(
                db.get_database_backend(),
                "SELECT amount FROM debt".to_owned(),
            ))
            .await?
            .expect("the test debt row to exist");

        assert_eq!(row.try_get::<i64>("", "amount")?, 2_147_483_648);
        Ok(())
    }
}
