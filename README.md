# organic-nginx-configurator

A cell which is aggregating chemicals for cluster's cell topology and notifies
nginx for changes by issueing nginx configuration reload.

* (!) It is executed as root user to be able to configure nginx. 
* It is restarted on failure or reboot.
* It is installed on host machines via script.
* It uses `organic-plasma-channel` to recieve chemicals

## pre-requirements

* `ssh` access as root to a VPS with NGINX
* `scp`

## install

At your local command line execute

```
$ npx node-organic/organic-nginx-configurator install <remote-ip>
```

## emits reannonce request

`dna.channel.emitReannonceType` is broadcasted to running cells and they need to 
respond with `onCellAnnoncing` cell control chemical to be included in nginx proxy config

## dynamically set template

```
{
  action: "setTemplate",
  template: String // ejs template
}
```

## cell control chemicals

```
{
  action: String,
  cellInfo: CellInfo
}
```

### actions

* `onCellStarting`
* `onCellAnnoncing`
* `onCellStopping`

### CellInfo shape

```
name: String
version: String // X.Y.Z or git-sha
endpoint: String // url || absolute_directory_path
mountpoint: String // relative url to provided domain
domain: String // domain.com or sub.domain.com
```

## howto

### set custom organic-nginx-configurator dna

1. create `dna/cells/organic-nginx-configurator.json`
2. execute `$ npx organic-nginx-configurator install <remote-ip>`

### set custom nginx conf

1. create `dna/cells/organic-nginx-configurator.json`
2. set `templatePath` property of `cells.organic-nginx-configurator.build.nginx-config` path to relative `ejs` file
2. execute `$ npx organic-nginx-configurator install <remote-ip>`
