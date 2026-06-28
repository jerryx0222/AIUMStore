(function () {
  var MAX_LEVEL = 5;
  var allCategories = [];

  function fieldRow(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    return el.closest(".form-row") || el.parentElement;
  }

  function uniqueNames(categories) {
    var seen = {};
    var names = [];
    categories.forEach(function (c) {
      if (!seen[c.name]) {
        seen[c.name] = true;
        names.push(c.name);
      }
    });
    return names;
  }

  function distinctSubValues(categories, level) {
    var key = "sub_category_" + level;
    var seen = {};
    var values = [];
    categories.forEach(function (c) {
      var v = c[key];
      if (v && !seen[v]) {
        seen[v] = true;
        values.push(v);
      }
    });
    return values;
  }

  function setOptions(select, options, selectedValue) {
    var html = ['<option value="">請選擇</option>'];
    options.forEach(function (opt) {
      var selected = opt === selectedValue ? " selected" : "";
      html.push('<option value="' + opt + '"' + selected + ">" + opt + "</option>");
    });
    select.innerHTML = html.join("");
  }

  function resolve(seedCategoryId) {
    var nameSelect = document.getElementById("id_category_name");
    var categoryHidden = document.getElementById("id_category");
    var seedCategory = seedCategoryId
      ? allCategories.find(function (c) { return String(c.id) === String(seedCategoryId); })
      : null;

    var name = nameSelect.value || (seedCategory ? seedCategory.name : "");
    if (seedCategory) nameSelect.value = name;

    for (var lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      var row = fieldRow("id_sub_category_" + lvl);
      if (row) row.style.display = "none";
    }

    if (!name) {
      categoryHidden.value = "";
      return;
    }

    var candidates = allCategories.filter(function (c) {
      return c.name === name;
    });

    var level = 1;
    while (level <= MAX_LEVEL && candidates.length > 1) {
      var values = distinctSubValues(candidates, level);
      var subSelect = document.getElementById("id_sub_category_" + level);

      if (values.length === 0) {
        level++;
        continue;
      }
      if (values.length === 1) {
        candidates = candidates.filter(function (c) {
          return c["sub_category_" + level] === values[0];
        });
        level++;
        continue;
      }

      var row = fieldRow("id_sub_category_" + level);
      if (row) row.style.display = "";

      var seedValue = seedCategory ? seedCategory["sub_category_" + level] : "";
      var chosen = subSelect.value || seedValue || "";
      setOptions(subSelect, values, chosen);

      if (!chosen) {
        categoryHidden.value = "";
        return;
      }
      candidates = candidates.filter(function (c) {
        return c["sub_category_" + level] === chosen;
      });
      level++;
    }

    categoryHidden.value = candidates.length === 1 ? candidates[0].id : "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var nameSelect = document.getElementById("id_category_name");
    var categoryHidden = document.getElementById("id_category");
    if (!nameSelect || !categoryHidden) return;

    fetch("/api/products/categories/")
      .then(function (res) {
        return res.json();
      })
      .then(function (categories) {
        allCategories = categories;
        var names = uniqueNames(categories);
        var currentCategoryId = categoryHidden.getAttribute("data-current");
        var currentName = "";
        if (currentCategoryId) {
          var current = categories.find(function (c) {
            return String(c.id) === String(currentCategoryId);
          });
          if (current) currentName = current.name;
        }
        setOptions(nameSelect, names, currentName);

        resolve(currentCategoryId);

        nameSelect.addEventListener("change", function () {
          for (var lvl = 1; lvl <= MAX_LEVEL; lvl++) {
            var s = document.getElementById("id_sub_category_" + lvl);
            if (s) s.value = "";
          }
          resolve(null);
        });

        for (var level = 1; level <= MAX_LEVEL; level++) {
          (function (lvl) {
            var subSelect = document.getElementById("id_sub_category_" + lvl);
            if (!subSelect) return;
            subSelect.addEventListener("change", function () {
              for (var l = lvl + 1; l <= MAX_LEVEL; l++) {
                var s = document.getElementById("id_sub_category_" + l);
                if (s) s.value = "";
              }
              resolve(null);
            });
          })(level);
        }
      });
  });
})();
