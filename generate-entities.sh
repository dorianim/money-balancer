DB_FILE="./.tmp-db.sqlite"
export DATABASE_URL="sqlite:$DB_FILE?mode=rwc"

cargo run --manifest-path ./migration/Cargo.toml -- fresh
sea-orm-cli generate entity -o src/model

rm $DB_FILE