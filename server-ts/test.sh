set -e
set -u

URL=https://money-balancer.itsblue.workers.dev
CREATED="yes"

if [ "$CREATED" = "no" ]; then
    http --check-status post $URL/user username=alice nickname="Alice" password=12345678
    if http --check-status post $URL/user username=alice nickname="Alice" password=12345678; then
        echo "Error: user could be created twice!"
    fi
    http --check-status post $URL/user username=bob nickname="Bob" password=12345678
fi

TOKEN_ALICE=$(http --check-status post https://money-balancer.itsblue.workers.dev/user/token username=alice password=12345678 | jq .token)
TOKEN_BOB=$(http --check-status post https://money-balancer.itsblue.workers.dev/user/token username=bob password=12345678 | jq .token)

AUTH="-A bearer -a"
BALANCE_ID=$(http $AUTH $TOKEN_ALICE --check-status post https://money-balancer.itsblue.workers.dev/balance name=Test | jq .id)

echo $BALANCE_ID
