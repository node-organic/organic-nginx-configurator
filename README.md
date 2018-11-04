# organic-nginx-configurator

A cell which is aggregating chemicals for cluster's cell topology and notifies
NGINX for changes by issuing NGINX configuration reload.

* (!) It is executed as root user to be able to configure NGINX. 
* It is restarted on failure or reboot.
* It is installed on host machines via script.
* It uses `organic-plasma-channel` to receive chemicals

## pre-requirements

* `ssh` access as root to a VPS with NGINX
* `scp`

## install

At your local command line execute

```
$ npx node-organic/organic-nginx-configurator <remote-ip>
```

or with custom ejs template

```
$ npx node-organic/organic-nginx-configurator <remote-ip> <path-to-nginx-ejs-template>
```

## cell control chemicals

#### onCellMitosisComplete

```
{
  type: "control",
  action: "onCellApoptosisComplete",
  cellInfo: {
    name: String
    version: String // X.Y.Z or git-sha
    endpoint: String // url || absolute_directory_path
    mountpoint: String // relative url to provided domain
    domain: String // domain.com or sub.domain.com
    mitosis: {
      apoptosis: {
        versionConditions: [String] // 'major', 'minor', 'patch', 'prerelease', 'build'
      }
    }
  }
}
```

#### onCellApoptosisComplete

```
{
  type: "control",
  action: "onCellApoptosisComplete",
  cellInfo: {
    name: String,
    version: String
  }
}
```
