# organic-nginx-configurator

A cell which is aggregating chemicals for cluster's cell topology and notifies
NGINX for changes by issuing NGINX configuration reload.

* (!) It is executed as root user to be able to configure NGINX. 
* It is restarted on failure or reboot.
* It is installed on host machines via script.
* It uses host machine's directory with cell deployments metadata to update nginx conf

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
$ npx node-organic/organic-nginx-configurator <remote-ip> <path-to-dir-with-nginx-ejs-template>
```

## cell deployment metadata

A json file containing the following structure.

```
{
  name: String
  version: String,
  mode: String,
  endpoint: String, // url || absolute_directory_path
  domain: String // domain.com or sub.domain.com
  mountpoint: String, // relative url to provided domain
}
```

Any `.json` file found (or created) at deployment directory is used to build proxy rules.
Removing the file will remove the according proxy rules.
