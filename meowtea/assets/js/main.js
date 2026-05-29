$(document).ready(function () {

  $(".back-to-top-link").on("click", function (e) {
    e.preventDefault();
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      600
    );
  });


  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn();
    } else {
      $(".back-to-top").fadeOut();
    }
  });


  $(document).on("click", ".add-to-cart-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const productId = $(this).data("product-id");
    openProductCustomizeModal(productId);
  });


  updateCartCount();


  $(".user-dropdown-toggle").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $dropdown = $(this).closest(".user-dropdown");
    $dropdown.toggleClass("active");
  });


  $(document).on("click", function (e) {
    if (!$(e.target).closest(".user-dropdown").length) {
      $(".user-dropdown").removeClass("active");
    }
  });


  $(".dropdown-item").on("click", function () {
    $(".user-dropdown").removeClass("active");
  });




  function openProductCustomizeModal(productId) {
    const $modal = $("#product-customize-modal");
    const $loading = $("#modal-loading");
    const $content = $("#modal-product-content");

    const finishLoading = window.AppLoading ? window.AppLoading.start() : function () {};
    $content.hide();
    $loading.hide();


    $.ajax({
      url: getApiPath(`product/get?id=${productId}`),
      method: "GET",
      dataType: "json",
      success: function (response) {
        if (response.success && response.data) {
          renderProductModal(response.data);
          $modal.addClass("active");
          $("body").css("overflow", "hidden");
          $content.show();
          $content.addClass("app-content-swap");
          setTimeout(function () {
            $content.removeClass("app-content-swap");
          }, 220);
        } else {
          showSnackBar('failed', "Không thể tải thông tin sản phẩm: " + (response.message || "Lỗi không xác định"));
          closeProductModal();
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading product:", error);
        showSnackBar('failed', "Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại.");
        closeProductModal();
      },
      complete: finishLoading,
    });
  }


  function renderProductModal(data) {
    const product = data.product;
    const optionGroups = data.optionGroups;


    const giaNiemYet = product.GiaNiemYet ?? product.GiaCoBan ?? 0;
    const giaCoBan = product.GiaCoBan ?? product.GiaNiemYet ?? giaNiemYet;
    $("#modal-product-id").val(product.MaSP);
    $("#modal-base-price").val(giaNiemYet);
    $("#modal-product-name").text(product.TenSP);
    $("#modal-current-price").text(formatCurrency(giaNiemYet));
    if (giaCoBan > giaNiemYet) {
      $("#modal-old-price").text(formatCurrency(giaCoBan)).show();
      $("#modal-reference-price").val(giaCoBan);
    } else {
      $("#modal-old-price").hide();
      $("#modal-reference-price").val("");
    }


    const imagePath = product.HinhAnh || "assets/img/products/product_one.png";
    const imageUrl = imagePath.startsWith("assets/") ? "/" + imagePath : imagePath;
    $("#modal-product-image").attr("src", imageUrl).attr("alt", product.TenSP);


    $("#modal-quantity").val(1);
    $("#modal-quantity-display").text("01");
    $("#modal-product-note").val("");
    $("#modal-char-count").text("0");


    const $optionGroupsContainer = $("#modal-option-groups");
    $optionGroupsContainer.empty();

    optionGroups.forEach(function (group) {
      const $groupDiv = $('<div class="option-group"></div>');
      const titleText = group.IsMultiple
        ? `Thêm ${group.TenNhom}`
        : `Chọn ${group.TenNhom}`;
      const instructionText = group.IsMultiple ? "" : "Tối đa 1 loại";
      $groupDiv.append(
        `<h3 class="option-group-title">
          ${titleText}
          ${
            instructionText
              ? `<span class="option-group-instruction">${instructionText}</span>`
              : ""
          }
        </h3>`
      );
      const listClass = group.IsMultiple
        ? "option-list option-list-checkbox"
        : "option-list option-list-radio";
      const $optionList = $('<div class="' + listClass + '"></div>');

      group.options.forEach(function (option, index) {
        const isFirst = index === 0;
        const inputType = group.IsMultiple ? "checkbox" : "radio";
        const inputName = group.IsMultiple
          ? "options[]"
          : `option_group_${group.MaOptionGroup}`;
        const checked = !group.IsMultiple && isFirst ? "checked" : "";

        const $optionItem = $(`
          <div class="option-item">
            <input 
              type="${inputType}" 
              name="${inputName}" 
              id="modal_option_${option.MaOptionValue}"
              value="${option.MaOptionValue}"
              data-price="${option.GiaThem}"
              class="${group.IsMultiple ? "option-checkbox" : "option-radio"}"
              ${checked}
            >
            <label for="modal_option_${option.MaOptionValue}">
              ${option.TenGiaTri}
            </label>
            ${
              option.GiaThem > 0
                ? `<span class="option-price">+${formatCurrency(
                    option.GiaThem
                  )}</span>`
                : ""
            }
          </div>
        `);

        $optionList.append($optionItem);
      });

      $groupDiv.append($optionList);
      $optionGroupsContainer.append($groupDiv);
    });


    initModalHandlers();
  }


  function initModalHandlers() {
    const basePrice = parseFloat($("#modal-base-price").val());
    let quantity = parseInt($("#modal-quantity").val()) || 1;


    function updateModalTotalPrice() {
      let total = basePrice;


      $(".option-checkbox:checked, .option-radio:checked").each(function () {
        total += parseFloat($(this).data("price") || 0);
      });


      total *= quantity;


      $("#modal-total-price").text(formatCurrency(total));
    }


    function formatQuantity(num) {
      return num < 10 ? "0" + num : num.toString();
    }


    $("#modal-increase-qty")
      .off("click")
      .on("click", function () {
        if (quantity < 10) {
          quantity++;
          $("#modal-quantity").val(quantity);
          $("#modal-quantity-display").text(formatQuantity(quantity));
          updateModalTotalPrice();
        }
      });

    $("#modal-decrease-qty")
      .off("click")
      .on("click", function () {
        if (quantity > 1) {
          quantity--;
          $("#modal-quantity").val(quantity);
          $("#modal-quantity-display").text(formatQuantity(quantity));
          updateModalTotalPrice();
        }
      });

    $("#modal-quantity")
      .off("change")
      .on("change", function () {
        quantity = Math.max(1, Math.min(10, parseInt($(this).val()) || 1));
        $(this).val(quantity);
        $("#modal-quantity-display").text(formatQuantity(quantity));
        updateModalTotalPrice();
      });


    $(document)
      .off(
        "change",
        "#modal-product-content .option-checkbox, #modal-product-content .option-radio"
      )
      .on(
        "change",
        "#modal-product-content .option-checkbox, #modal-product-content .option-radio",
        function () {
          $(this)
            .closest(".option-item")
            .toggleClass("selected", $(this).is(":checked"));
          updateModalTotalPrice();
        }
      );


    $(
      "#modal-product-content .option-radio:checked, #modal-product-content .option-checkbox:checked"
    ).each(function () {
      $(this).closest(".option-item").addClass("selected");
    });


    $("#modal-product-note")
      .off("input")
      .on("input", function () {
        const length = $(this).val().length;
        $("#modal-char-count").text(length);
      });


    $("#modal-add-to-cart-btn")
      .off("click")
      .on("click", function () {
        const options = [];


        $(
          "#modal-product-content .option-checkbox:checked, #modal-product-content .option-radio:checked"
        ).each(function () {
          options.push({
            option_value_id: $(this).val(),
            price: parseFloat($(this).data("price") || 0),
          });
        });


        let total = basePrice;
        options.forEach(function (opt) {
          total += opt.price;
        });
        total *= quantity;

        const formData = {
          product_id: $("#modal-product-id").val(),
          quantity: quantity,
          options: JSON.stringify(options),
          note: $("#modal-product-note").val(),
          base_price: basePrice,
          total_price: total,
        };
        var refPrice = parseFloat($("#modal-reference-price").val() || 0);
        if (refPrice > basePrice) formData.reference_price = refPrice;


        $.ajax({
          url: getApiPath("cart/add"),
          method: "POST",
          data: formData,
          dataType: "json",
          success: function (response) {
            if (response.success) {
              updateCartCount();
              showSnackBar('success', response.message || 'Đã thêm vào giỏ hàng thành công!');
            } else {
              showSnackBar('failed', response.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", error);
            showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
          },
        });
      });


    updateModalTotalPrice();
  }


  function closeProductModal() {
    $("#product-customize-modal").removeClass("active");
    $("body").css("overflow", "");
  }


  $("#close-modal-btn").on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeProductModal();
  });

  $(".modal-overlay").on("click", function (e) {
    if (e.target === this) {
      closeProductModal();
    }
  });


  $(document).on("keydown", function (e) {
    if (
      e.key === "Escape" &&
      $("#product-customize-modal").hasClass("active")
    ) {
      closeProductModal();
    }
  });
});
