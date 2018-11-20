const Plasma = require('organic-plasma')
const NginxOrganelle = require('../organelles/nginx-config')

const ejs = require('ejs')
const clean = (value) => {
  return value.toLowerCase().replace(/ /g, '').replace(/\n/g, '')
}

const nginxDNA = {
  'templatePath': './nginx.conf.ejs',
  'timeoutInterval': 100,
  'configPath': false
}
let plasma
let nginx
let template

beforeAll(() => {
  plasma = new Plasma()
  nginx = new NginxOrganelle(plasma, nginxDNA)
  nginx.startedCells.addMany(require('./nginx-started-cells.json'))
})

test('template is loaded', async () => {
  return nginx.templatePromise.then((templateContent) => {
    expect(templateContent).toBeDefined()
    template = templateContent
  })
})

test('template is rendered via ejs', () => {
  let result = ejs.render(template, {
    upstreams: nginx.getUpstreams(),
    servers: nginx.getServersAndLocations()
  })
  expect(clean(result)).toContain(clean(`
    upstream api-legacy1.0.0 {
        server http://localhost:7889;
        server http://localhost:5889;
        server http://localhost:6889;
    }
  `))
  expect(result).toContain('server_name mitosis.net')
  expect(result).toContain('server_name status.mitosis.net')
  expect(result).toContain('server_name 096a8b277ee.status.mitosis.net')
  expect(result).toContain('server_name api.mitosis.net')
  expect(clean(result)).toContain(clean(`
    server {
        listen 80;
        server_name mitosis.net;
        root /home/node/www/public;

        location / {
          root /home/node/public/front/;
          autoindex on;
        }

        location /api/1/search {
          proxy_pass http://search-api1.0.0/;
          proxy_set_header Host $host;
          proxy_set_header Referer $http_referer;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Host $server_name;
          proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/1 {
          proxy_pass http://api1.0.0/;
          proxy_set_header Host $host;
          proxy_set_header Referer $http_referer;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Host $server_name;
          proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
  `))
  expect(result).toBeDefined()
})
