use sea_orm_migration::prelude::*;

use super::{
    m20220912_000001_create_user_table::User, m20220912_000002_create_balance_table::Balance,
};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20220912_000003_create_balance_member_table"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let creator = Table::create()
            .table(BalanceMember::Table)
            .col(ColumnDef::new(BalanceMember::Id).string().not_null())
            .col(ColumnDef::new(BalanceMember::UserId).string().not_null())
            .col(ColumnDef::new(BalanceMember::BalanceId).string().not_null())
            .col(ColumnDef::new(BalanceMember::IsOwner).boolean().not_null())
            .primary_key(
                Index::create()
                    .col(BalanceMember::Id)
                    .col(BalanceMember::UserId)
                    .col(BalanceMember::BalanceId),
            )
            .foreign_key(
                ForeignKey::create()
                    .from(BalanceMember::Table, BalanceMember::UserId)
                    .to(User::Table, User::Id)
                    .on_delete(ForeignKeyAction::Restrict),
            )
            .foreign_key(
                ForeignKey::create()
                    .from(BalanceMember::Table, BalanceMember::BalanceId)
                    .to(Balance::Table, Balance::Id)
                    .on_delete(ForeignKeyAction::Cascade),
            )
            .to_owned();

        print!("{}", creator.to_string(SqliteQueryBuilder));

        manager.create_table(creator).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(BalanceMember::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum BalanceMember {
    Table,
    Id,
    UserId,
    BalanceId,
    IsOwner,
}
