use sea_orm::*;

#[derive(Debug)]
pub struct GroupService {
    db: DatabaseConnection,
}

impl GroupService {
    pub fn new(db: &DatabaseConnection) -> GroupService {
        GroupService { db: db }
    }
}

/*
async fn get_members_of_group(group: group::Model, db: &DatabaseConnection) -> Vec<user::Model> {
    group
        .find_related(group_member::Entity)
        .find_also_related(user::Entity)
        .all(db)
        .await
        .expect("error loading group members")
        .into_iter()
        .map(|group_member| group_member.1.unwrap())
        .collect::<Vec<user::Model>>()
}

async fn get_user_debts_of_group(group: group::Model, db: &DatabaseConnection) -> Vec<debt::Model> {
    group
    .find_related(group_member::Entity)
    .find_with_related(user_debt::Entity)
    .all(db)
    .await
    .expect("error loading group member user debts")
    .into_iter()
    .map(|group_member| group_member.1.unwrap())
    .collect::<Vec<user_debt::Model>>()
    Vec::new()
}*/
