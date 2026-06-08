{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  packages = [
    pkgs.git
    pkgs.gnumake
    pkgs.pre-commit
    pkgs.nodejs_24
  ];
}
