<?php
defined('L_EXEC') or die();

class LandingpageTheme
{

    private $_storageHelper;
    private $_globalConfig;
    private $_translations;
    private $_resultLevels;

    public function __construct($config, $storageHelper, $translations)
    {
        $this->_globalConfig = $config;
        $this->_storageHelper = $storageHelper;
        $this->_translations = $translations;

        $this->_resultLevels['loginSuccess'] = "success";
        $this->_resultLevels['loginFailed'] = "danger";
        $this->_resultLevels['ldapConnectFailed'] = "danger";
        $this->_resultLevels['ldapSearchFailed'] = "danger";
        $this->_resultLevels['ldapTlsInitializationFailed'] = "danger";
        $this->_resultLevels['bindingToLdapAdminFailed'] = "danger";
        $this->_resultLevels['loginRequired'] = "warning";
        $this->_resultLevels['oldPasswordIsWrong'] = "danger";
        $this->_resultLevels['newPasswordMustNotBeEqualToOldPassword'] = "danger";
        $this->_resultLevels['newPasswordAndRepeatDidNotMatch'] = "danger";
        $this->_resultLevels['passwordIsTooShort'] = "danger";
        $this->_resultLevels['passwordDoesNotContainANumberOrSpecialCharacter'] = "danger";
        $this->_resultLevels['passwordDoesNotContainALetter'] = "danger";
        $this->_resultLevels['passwordDoesNotContainAnUppercaseLetter'] = "danger";
        $this->_resultLevels['passwordDoesNotContainALowercaseLetter'] = "danger";
        $this->_resultLevels['passwordChangeLdapError'] = "danger";
        $this->_resultLevels['newPasswordMustNotBeOldPassword'] = "danger";
        $this->_resultLevels['passwordChangedSuccessfully'] = 'success';
        $this->_resultLevels['emailChangedSuccessfully'] = 'success';
        $this->_resultLevels['emailChangeLdapError'] = 'danger';
        $this->_resultLevels['invalidEmailError'] = 'danger';
        $this->_resultLevels['permissionDenied'] = 'danger';
        $this->_resultLevels['generateJitsiLinkRoomMustNotBeEmpty'] = 'danger';
        $this->_resultLevels['generateJitsiLinkSuccessfull'] = 'success';
        $this->_resultLevels['purchaseAddedSuccessfully'] = 'success';
        $this->_resultLevels['purchaseDeleteSuccess'] = 'success';
        $this->_resultLevels['purchaseDeleteError'] = 'danger';
    }

    public function printPage($page, $parameters)
    {
        switch ($page) {
            case 'balance':
                $this->_printBalance("balance");
                break;
            case 'login':
                $this->_printLogin();
                break;
        }
    }

    private function _printBalance($balance)
    {
        $balance = $this->_storageHelper->loadUserBalance($balance, $_SESSION["auth"]["username"]);

        $this->_printHeader();
?>
        <main>
            <div class="container py-4">
                <header class="pb-3 mb-4 border-bottom">
                    <a href="/" class="d-flex align-items-center text-dark text-decoration-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="32" class="me-2" viewBox="0 0 118 94" role="img">
                            <title>Bootstrap</title>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M24.509 0c-6.733 0-11.715 5.893-11.492 12.284.214 6.14-.064 14.092-2.066 20.577C8.943 39.365 5.547 43.485 0 44.014v5.972c5.547.529 8.943 4.649 10.951 11.153 2.002 6.485 2.28 14.437 2.066 20.577C12.794 88.106 17.776 94 24.51 94H93.5c6.733 0 11.714-5.893 11.491-12.284-.214-6.14.064-14.092 2.066-20.577 2.009-6.504 5.396-10.624 10.943-11.153v-5.972c-5.547-.529-8.934-4.649-10.943-11.153-2.002-6.484-2.28-14.437-2.066-20.577C105.214 5.894 100.233 0 93.5 0H24.508zM80 57.863C80 66.663 73.436 72 62.543 72H44a2 2 0 01-2-2V24a2 2 0 012-2h18.437c9.083 0 15.044 4.92 15.044 12.474 0 5.302-4.01 10.049-9.119 10.88v.277C75.317 46.394 80 51.21 80 57.863zM60.521 28.34H49.948v14.934h8.905c6.884 0 10.68-2.772 10.68-7.727 0-4.643-3.264-7.207-9.012-7.207zM49.948 49.2v16.458H60.91c7.167 0 10.964-2.876 10.964-8.281 0-5.406-3.903-8.178-11.425-8.178H49.948z" fill="currentColor"></path>
                        </svg>
                        <span class="fs-4"><?= $this->_trId("globals.title"); ?></span>
                    </a>
                </header>

                <div class="alert <?= $balance < 0 ? "alert-danger" : "alert-success" ?> mb-3">
                    <?= $this->_trId("currentBalance") ?>
                    <h1><?= $balance ?></h1>
                </div>

                <?php $this->_printResultAlert(); ?>

                <div class="card text-dark bg-light mb-3">
                    <div class="card-header w-100"><?= $this->_trId("addPurchase") ?></div>
                    <div class="card-body w-100" style="text-align: left;">
                        <form method="post" action="balance/submit">
                            <div class="mb-3">
                                <label for="name"><?= $this->_trId("name") ?></label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="amount"><?= $this->_trId("amount") ?></label>
                                <input type="number" step=".01" name="amount" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary"><?= $this->_trId("submit") ?></button>
                        </form>
                    </div>
                </div>
                <?php
                $this->_printData();
                ?>

                <footer class="pt-3 mt-4 text-muted border-top">
                    Version: <?= $GLOBALS["VERSION"] ?>
                </footer>
            </div>
        </main>

    <?php



        $this->_printFooter();
    }

    private function _printLogin()
    {
    ?>
        <h1>Please login!</h1>
    <?php
    }

    // --------------
    // - JavaScript -
    // --------------

    // -----------
    // - Helpers -
    // -----------

    private function _printHeader($printOnlySkeleton = false)
    {
    ?>
        <!DOCTYPE html>
        <html>

        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">

            <!-- Bootstrap -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js" integrity="sha384-ygbV9kiqUc6oa4msXn9868pTtWMgiQaeYH7/t7LECLbyPA2x65Kgf80OJFdroafW" crossorigin="anonymous"></script>

            <style>
                :root {
                    --primary_500: 255, 0, 0;
                }

                .mr-4 {
                    margin-right: 1.5rem !important;
                }

                .ml-4 {
                    margin-left: 1.5rem !important;
                }

                .card {
                    align-items: center;
                    text-align: center;
                }

                .card-footer {
                    width: 100%;
                }

                a:focus {
                    outline: none;
                }
            </style>

            <title><?= $this->_trId("globals.title"); ?></title>
            <?php
            if (!$printOnlySkeleton) :

            ?>
        </head>
    <?php
            endif;
        }

        private function _printResultAlert()
        {
            if (!isset($_SESSION['lastResult']) || $_SESSION['lastResult'] === 'loginSuccess')
                return;

            $this->_printAlert($this->_resultToMessage($_SESSION['lastResult']), $this->_resultLevels[$_SESSION['lastResult']]);
        }

        private function _printAlert($content, $level = 'waring', $dismissible = true)
        {
    ?>
    <div class="alert alert-<?= $level ?> <?php if ($dismissible) echo "alert-dismissible"; ?> fade show" role="alert">
        <strong><?= $content ?></strong>
        <?php if ($dismissible) : ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        <?php endif; ?>
    </div>
<?php
        }

        private function _printFooter()
        {
?>
    <script>
        var forms = document.getElementsByTagName('form')

        for (const form of forms) {
            var formButtons = form.getElementsByTagName("button");
            for (const button of formButtons) {
                if (button.type === "submit") {
                    form.addEventListener("submit", () => {
                        button.innerHTML += ' <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>'
                        button.disabled = true
                    })
                }
            }

            var formInputs = form.getElementsByTagName("input")
            for (const input of formInputs) {
                form.addEventListener("submit", () => {
                    input.readonly = true
                })
            }
        }
    </script>

        </html>
    <?php
        }

        private function _resultToMessage($result)
        {
            return $this->_translations['results'][$result];
        }

        private function _trId($id)
        {
            $result = $this->_translations;
            foreach (explode(".", $id) as $sub) {
                $result = $result[$sub];
            }
            return $result;
        }

        private function _printData()
        {
    ?>

        <div class="card text-dark bg-light mb-3">
            <div class="card-header w-100">History</div>
            <div class="card-body w-100" style="text-align: left;">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Description</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Time</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php

                        foreach ($this->_storageHelper->loadUserData("balance", $_SESSION["auth"]["username"], 0, 30) as $purchase):
                        ?>

                            <tr class="<?= $purchase["edit"] ? "table-primary":"table-light" ?>">
                                <th scope="row"><?= $purchase["name"] ?></th>
                                <td><?= $purchase["amount"] ?></td>
                                <td><?= date("Y-m-d H:i:s", $purchase["time"]) ?></td>
                                <td style="text-align: end;"> <?php if ($purchase["edit"]): ?>
                                    <form method="post" action="balance/remove">
                                        <input type="hidden" name="name"  value="<?= $purchase["name"] ?>">
                                        <input type="hidden" name="amount"  value="<?= $purchase["amount"] ?>">
                                        <input type="hidden"  name="time"  value="<?= $purchase["time"] ?>">
                                        <button type="submit" class="btn btn-danger btn-sm">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </form>
                                <?php endif; ?>
                                </td>
                            </tr>
                        <?php
                        endforeach;
                        ?>
                    </tbody>
                </table>
            </div>
        </div>
<?php
        }
    }
