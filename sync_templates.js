'use strict';


const rimraf = require('rimraf');
const path = require('path');
const mv = require('mv');
const mkdirp = require('mkdirp');
const clone = require("nodegit").Clone;
const replace = require("replace");
const filter = require('filter-files');
const findInFiles = require('find-in-files');
const ncp = require('ncp').ncp;
const Finder = require('fs-finder');
const deferred = require('deferred');

// Clone a given repository into the `./tmp` folder.
rimraf.sync(__dirname + '/templates')
rimraf.sync(__dirname + '/tmp')
mkdirp('./templates')

clone("https://github.com/googlesamples/android-architecture", "./tmp")
  .then(function(repo) {
    checkOutAndCopy(repo, "todo-mvp")(function(success) {
      checkOutAndCopy(repo, "todo-mvp-dagger")(function(success) {
        checkOutAndCopy(repo, "todo-mvp-loaders")(function(success) {
          checkOutAndCopy(repo, "todo-mvp-clean")(function(success) {
            checkOutAndCopy(repo, "todo-mvp-rxjava")(function(success) {
              checkOutAndCopy(repo, "todo-mvp-contentproviders")(function(success) {
                checkOutAndCopy(repo, "todo-databinding")(function(success) {
                  rimraf.sync(__dirname + '/tmp')
                  console.log('success is', success);
                });
              });
            });
          });
        });
      });
    });
  })
  .catch(function(err) {
    console.log(err);
  });

function checkOutAndCopy(repo, name) {
  let def = deferred();
  repo.getBranch('refs/remotes/origin/' + name)
    .then(function(reference) {
      console.log("Checking out branch " + name);
      return repo.checkoutRef(reference);
    })
    .then(function() {
      copyFiles(name, def);
    });
  return def.promise;
}

function copyFiles(name, def) {
  console.log("Copying files to ./templates/" + name);

  ncp('./tmp/todoapp', './templates/' + name, function(err) {
    if (err) {
      return console.error(err);
      def.reject('error');
    } else {
      replaceAndRename(name);
      renameFileToFtl(name)
      def.resolve('Copying complete!');
    }
  });
}

function replaceAndRename(name) {
  let dotGitignore = "./templates/" + name + "/.gitignore";
  let gitIgnore = "./templates/" + name + "/gitignore";
  let appDotGitignore = "./templates/" + name + "/app/.gitignore";
  let appGitIgnore = "./templates/" + name + "/app/gitignore";

  replace({
    regex: 'com.example.android.architecture.blueprints.todoapp',
    replacement: '${packageName}',
    paths: ['./templates/' + name],
    recursive: true,
    silent: true,
  });

  mv(dotGitignore, gitIgnore, function(err) {
    if (err) {
      return console.log(err);
    } else {
      return console.log("Renamed root folder gitignore");
    }
  });

  mv(appDotGitignore, appGitIgnore, function(err) {
    if (err) {
      return console.log(err);
    } else {
      return console.log("Renamed app folder gitignore");
    }
  });
}

function renameFileToFtl(name) {
  Finder.from("./templates/" + name).findFiles('*.java', function(files) {
    for (var i = 0; i < files.length; i++) {
      mv(files[i], files[i] + '.ftl', function(err) {
        if (err) {
          return console.log(err);
        }
      });
    };
  });

  Finder.from("./templates/" + name).findFiles('*.xml', function(files) {
    for (var i = 0; i < files.length; i++) {
      mv(files[i], files[i] + '.ftl', function(err) {
        if (err) {
          return console.log(err);
        }
      });
    };
  });
}