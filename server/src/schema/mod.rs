use sea_orm_migration::prelude::*;

mod m20220912_000001_create_user_table;
mod m20220912_000002_create_balance_table;
mod m20220912_000003_create_balance_member_table;
mod m20220912_000004_create_user_debt_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220912_000001_create_user_table::Migration),
            Box::new(m20220912_000002_create_balance_table::Migration),
            Box::new(m20220912_000003_create_balance_member_table::Migration),
            Box::new(m20220912_000004_create_user_debt_table::Migration),
        ]
    }
}
