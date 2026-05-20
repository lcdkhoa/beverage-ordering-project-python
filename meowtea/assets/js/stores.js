$(document).ready(function () {

  function setStoresHeroHeight() {
    const header = $(".main-header");
    const headerHeight = header.length > 0 ? header.outerHeight() : 80;
    const viewportHeight = window.innerHeight;
    const heroHeight = viewportHeight - headerHeight;

    $(".stores-hero").css("height", heroHeight + "px");
  }


  setStoresHeroHeight();


  $(window).on("resize", handleResize(setStoresHeroHeight, 250));


  function renderStores(stores, total) {
    const $grid = $("#stores-grid");
    const $count = $(".stores-count");

    if (!$grid.length) {
      return;
    }


    if ($count.length) {
      $count.text(`Tất cả có ${total} cửa hàng`);
    }


    if (!stores || !stores.length) {
      $grid.html(
        '<div class="no-stores">Không tìm thấy cửa hàng nào phù hợp với tiêu chí tìm kiếm của bạn.</div>'
      );
      return;
    }


    const itemsHtml = stores
      .map((store) => {
        const name = store.TenStore || "";
        const address = store.DiaChi || "";
        const phone = store.DienThoai || "";
        const maStore = store.MaStore || "";

        const imageSrc = `/assets/img/stores/${maStore}.jpg`;
        const orderHref = "/menu";
        const directionsHref =
          "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(address);

        return `
          <div class="store-card">
            <img 
              src="${imageSrc}" 
              alt="MeowTea Fresh - ${name}"
              class="store-image"
              onerror="this.src='/assets/img/products/product_banner.png'"
            >
            <div class="store-info">
              <h3 class="store-name">MeowTea Fresh<br>${name}</h3>
              <div class="store-hours">Mở cửa đến 22:00</div>
              <div class="store-address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${address}</span>
              </div>
              <div class="store-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>${phone}</span>
              </div>
              <div class="store-actions">
                <a href="${orderHref}" class="button button-primary btn-order" style="width: 150px;">
                  Đặt ngay
                </a>
                <a href="${directionsHref}" class="button button-outline btn-directions" style="width: 200px;" target="_blank" rel="noopener noreferrer">
                  Chỉ đường
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    $grid.html(itemsHtml);
  }


  const performSearch = debounce(function () {
    const keyword = $("#search-keyword").val().trim();
    const province = $("#search-province").val();
    const ward = $("#search-ward").val();

    $.ajax({
      url: "/api/stores/search",
      method: "GET",
      dataType: "json",
      data: {
        keyword,
        province,
        ward,
      },
      success: function (response) {
        if (response && response.success) {
          renderStores(response.stores || [], response.total || 0);
        } else {
          renderStores([], 0);
        }
      },
      error: function () {


      },
    });
  }, 400);


  $("#search-keyword").on("input", performSearch);
  $("#search-province, #search-ward").on("change", performSearch);


  $("#search-keyword").on("keypress", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      performSearch();
    }
  });
});
