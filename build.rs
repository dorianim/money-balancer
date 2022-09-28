use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=client");

    let status = Command::new("yarn")
        .arg("install")
        .current_dir("client")
        .status()
        .expect("failed to install client dependencies");
    assert!(status.success());

    Command::new("yarn")
        .arg("run")
        .arg("build")
        .current_dir("client")
        .status()
        .expect("failed to build client");
    assert!(status.success());
}
