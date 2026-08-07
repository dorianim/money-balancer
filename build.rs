#[cfg(not(debug_assertions))]
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=client/package.json");
    println!("cargo:rerun-if-changed=client/package-lock.json");
    println!("cargo:rerun-if-changed=client/tsconfig.json");
    println!("cargo:rerun-if-changed=client/.eslintrc.js");
    println!("cargo:rerun-if-changed=client/.eslintignore");
    println!("cargo:rerun-if-changed=client/public");
    println!("cargo:rerun-if-changed=client/src");
    build_client();
}

#[cfg(not(debug_assertions))]
fn build_client() {
    let install_status = Command::new("npm")
        .arg("ci")
        .current_dir("client")
        .status()
        .expect("failed to install client dependencies");
    assert!(
        install_status.success(),
        "failed to install client dependencies"
    );

    let build_status = Command::new("npm")
        .arg("run")
        .arg("build")
        .current_dir("client")
        .status()
        .expect("failed to build client");
    assert!(build_status.success(), "failed to build client");
}

#[cfg(debug_assertions)]
fn build_client() {
    // skip in debug builds
}
