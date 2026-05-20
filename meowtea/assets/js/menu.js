$(document).ready(function () {
  const $searchForm = $(".search-form");
  const $searchInput = $searchForm.find('input[name="search"]');
  const $wrapper = $("#menu-products-wrapper");

  if (!$searchForm.length || !$wrapper.length) {
    return;
  }

  function getCurrentParams() {
    const categoryId = $wrapper.data("category-id") || "";
    const bestseller = $wrapper.data("bestseller") || "0";
    const topping = $wrapper.data("topping") || "0";
    const page = $wrapper.data("page") || 1;

    return {
      category: categoryId || undefined,
      bestseller: bestseller === "1" ? "1" : undefined,
      topping: topping === "1" ? "1" : undefined,
      page,
    };
  }

  function updateWrapperData(params) {
    $wrapper.data("category-id", params.category || "");
    $wrapper.data("bestseller", params.bestseller === "1" ? "1" : "0");
    $wrapper.data("topping", params.topping === "1" ? "1" : "0");
    $wrapper.data("page", params.page || 1);
  }

  function buildUrlForHistory(params, keyword) {
    const urlParams = new URLSearchParams();

    if (params.category) {
      urlParams.set("category", params.category);
    }
    if (params.bestseller === "1") {
      urlParams.set("bestseller", "1");
    }
    if (params.topping === "1") {
      urlParams.set("topping", "1");
    }
    if (keyword) {
      urlParams.set("search", keyword);
    }
    if (params.page && params.page > 1) {
      urlParams.set("page", params.page);
    }

    const newUrl =
      window.location.pathname +
      (urlParams.toString() ? "?" + urlParams.toString() : "");

    window.history.replaceState(null, "", newUrl);
  }

  function fetchMenu(params) {
    const keyword = $searchInput.val().trim();
    const finalParams = { ...getCurrentParams(), ...params };

    if (!("page" in params)) {
      finalParams.page = 1;
    }

    const ajaxData = {
      ...finalParams,
      search: keyword,
    };

    $.ajax({
      url: getApiPath("menu/search"),
      method: "GET",
      dataType: "json",
      data: ajaxData,
      success: function (response) {
        if (!response || !response.success) {
          return;
        }

        if (response.headingHtml) {
          $("#menu-section-heading").replaceWith(response.headingHtml);
        }

        if (response.contentHtml) {
          $wrapper.html(response.contentHtml);
        }

        updateWrapperData(finalParams);
        buildUrlForHistory(finalParams, keyword);
      },
      error: function () {

      },
    });
  }

  const performSearch = debounce(function () {
    fetchMenu({});
  }, 400);

  $searchInput.on("input", function () {
    performSearch();
  });

  $searchForm.on("submit", function (e) {
    e.preventDefault();
    performSearch();
  });

  $searchInput.on("keypress", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      performSearch();
    }
  });


  $(".category-list").on("click", ".category-link", function (e) {
    e.preventDefault();

    const $item = $(this).closest(".category-item");
    const href = $(this).attr("href") || "";
    let searchPart = "";

    const qIndex = href.indexOf("?");
    if (qIndex !== -1) {
      searchPart = href.substring(qIndex + 1);
    }

    const qs = new URLSearchParams(searchPart);

    const newParams = {
      category: qs.get("category") || undefined,
      bestseller: qs.get("bestseller") === "1" ? "1" : undefined,
      topping: qs.get("topping") === "1" ? "1" : undefined,
    };


    $(".category-item").removeClass("active");
    $item.addClass("active");


    fetchMenu(newParams);
  });


  $wrapper.on("click", ".pagination .pagination-number, .pagination .pagination-btn", function (e) {
    e.preventDefault();
    var p = parseInt($(this).data("page"), 10);
    if (p >= 1) {
      fetchMenu({ page: p });
    }
  });
});

