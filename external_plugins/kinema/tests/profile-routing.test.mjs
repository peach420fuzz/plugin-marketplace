// URL-shape and identity-status tests; none prove a remote account exists.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {profileLink} from '../server/taste-engine.mjs';
for(const [platform,url] of [
 ['letterboxd','https://letterboxd.com/film/example/'],['letterboxd','https://letterboxd.com/search/'],
 ['imdb','https://www.imdb.com/title/tt1234567/'],['imdb','https://www.imdb.com/name/nm1234567/'],
 ['kinopoisk','https://www.kinopoisk.ru/film/123/'],['myshows','https://myshows.me/news/12799/summer2026/'],
 ['myshows','https://myshows.me/profile/'],['myshows','https://myshows.me/about/faq/']
])test(`${platform} non-profile URL is rejected: ${new URL(url).pathname}`,()=>assert.throws(()=>profileLink(platform,url)));
test('IMDb explicit current p. profile format remains supported',()=>{const p=profileLink('imdb','https://www.imdb.com/user/p.colneedham/');assert.equal(p.url,'https://www.imdb.com/user/p.colneedham/');assert.equal(p.handle,'p.colneedham')});
test('IMDb legacy ur identifier remains supported',()=>assert.equal(profileLink('imdb','ur1000000').url,'https://www.imdb.com/user/ur1000000/'));
test('IMDb display name is unresolved instead of an invented profile URL',()=>{const p=profileLink('imdb','Example Viewer');assert.equal(p.url,null);assert.equal(p.status,'public-profile-needs-resolution')});
test('Kinopoisk display name with spaces remains a resolution input',()=>{const p=profileLink('kinopoisk','Example Viewer');assert.equal(p.url,null);assert.equal(p.handle,'Example Viewer')});
test('explicit Kinopoisk profile path is preserved without guessing numeric ID',()=>assert.equal(profileLink('kinopoisk','https://www.kinopoisk.ru/user/exampleviewer/').url,'https://www.kinopoisk.ru/user/exampleviewer/'));
test('MyShows username yields the observed root profile route',()=>assert.equal(profileLink('myshows','exampleviewer').url,'https://myshows.me/exampleviewer'));
test('Letterboxd rating subpage resolves the same supplied account',()=>assert.equal(profileLink('letterboxd','https://letterboxd.com/exampleviewer/films/rated/5/').handle,'exampleviewer'));
test('credential-bearing profile URLs remain rejected',()=>assert.throws(()=>profileLink('imdb','https://user:secret@www.imdb.com/user/ur1000000/')));
