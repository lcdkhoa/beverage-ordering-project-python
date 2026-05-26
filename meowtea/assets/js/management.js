$(document).ready(function () {
  const apiBasePath = getApiBasePath();
  const isAdmin = $("#btn-add-product").length > 0; // Check if add button exists


  $(".tab-btn").on("click", function () {
    const tab = $(this).data("tab");


    $(".tab-btn").removeClass("active");
    $(this).addClass("active");


    $(".management-section-content").removeClass("active");
    if (tab === "products") {
      $("#products-section").addClass("active");
      if (
        $("#products-accordion").html().trim() === "" ||
        $("#products-accordion").html().includes("loading-spinner")
      ) {
        loadProducts();
      }
    } else if (tab === "toppings") {
      $("#toppings-section").addClass("active");
      if (
        $("#toppings-table-wrapper").html().trim() === "" ||
        $("#toppings-table-wrapper").html().includes("loading-spinner")
      ) {
        loadToppings();
      }
    }
  });


  loadProducts();


  if (isAdmin) {
    loadCategories();
  }



  $("#btn-add-product").on("click", function () {

    if (isAdmin) {
      loadCategories();
    }
    $("#add-product-modal").addClass("active");

    setTimeout(function () {
      $("#add-product-form")[0].reset();

      $("#product-category").prop("disabled", false);
    }, 100);
  });

  $("#close-add-modal, #cancel-add-product, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-add-product"
      ) {
        $("#add-product-modal").removeClass("active");
      }
    }
  );


  $(document).on("click", ".btn-edit-product", function () {
    const productId = $(this).data("product-id");
    const productName = $(this).data("product-name");
    const currentPrice = $(this).data("product-price");
    const productImage = $(this).data("product-image");

    $("#edit-product-id").val(productId);
    $("#edit-product-name").val(productName);
    $("#edit-product-price").val(currentPrice);
    $("#edit-product-image").val("");
    $("#edit-product-image").data("current-src", resolveImageSrc(productImage));
    $("#edit-product-preview-img").attr("src", resolveImageSrc(productImage));
    $("#edit-product-image-preview").show();
    $("#edit-product-modal").addClass("active");
  });

  $("#close-edit-product-modal, #cancel-edit-product, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-edit-product"
      ) {
        $("#edit-product-modal").removeClass("active");
      }
    }
  );


  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".modal").removeClass("active");
    }
  });



  $("#btn-add-topping").on("click", function () {
    $("#add-topping-modal").addClass("active");
    setTimeout(function () {
      $("#add-topping-form")[0].reset();
      $("#topping-image-preview").hide();
    }, 100);
  });

  $("#close-add-topping-modal, #cancel-add-topping, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-add-topping"
      ) {
        $("#add-topping-modal").removeClass("active");
      }
    }
  );


  $(document).on("click", ".btn-edit-topping-price", function () {
    const toppingId = $(this).data("topping-id");
    const toppingName = $(this).data("topping-name");
    const currentPrice = $(this).data("topping-price");

    $("#edit-topping-id").val(toppingId);
    $("#edit-topping-name").val(toppingName);
    $("#edit-topping-price").val(currentPrice);
    $("#edit-topping-price-modal").addClass("active");
  });

  $("#close-edit-topping-modal, #cancel-edit-topping-price, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-edit-topping-price"
      ) {
        $("#edit-topping-price-modal").removeClass("active");
      }
    }
  );


  $(document).on("click", ".btn-delete-topping", function () {
    const toppingId = $(this).data("topping-id");
    const toppingName = $(this).data("topping-name");


    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa topping '" +
          toppingName +
          "'?\n\nHành động này không thể hoàn tác."
      )
    ) {
      return;
    }


    $.ajax({
      url: apiBasePath + "delete-topping",
      method: "POST",
      data: {
        topping_id: toppingId,
      },
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          loadToppings(); // Reload toppings list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi xóa topping. Vui lòng thử lại.");
      },
    });
  });


  $("#topping-image").on("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $("#topping-preview-img").attr("src", e.target.result);
        $("#topping-image-preview").show();
      };
      reader.readAsDataURL(file);
    } else {
      $("#topping-image-preview").hide();
    }
  });


  $(document).on("click", ".btn-delete-product", function () {
    const productId = $(this).data("product-id");
    const productName = $(this).data("product-name");


    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa sản phẩm '" +
          productName +
          "'?\n\nHành động này không thể hoàn tác."
      )
    ) {
      return;
    }


    $.ajax({
      url: apiBasePath + "delete-product",
      method: "POST",
      data: {
        product_id: productId,
      },
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          loadProducts(); // Reload products list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.");
      },
    });
  });


  $("#product-image").on("change", function (e) {
    updateImagePreview($(this), $("#image-preview"), $("#preview-img"));
  });

  $("#edit-product-image").on("change", function () {
    updateImagePreview($(this), $("#edit-product-image-preview"), $("#edit-product-preview-img"));
  });



  $("#add-product-form").on("submit", function (e) {
    e.preventDefault();


    const tenSP = $("#product-name").val().trim();
    const maCategory = $("#product-category").val();
    const giaNiemYet = $("#product-price").val();
    const giaCoBan = $("#product-reference-price").val().trim();
    const imageFile = $("#product-image")[0].files[0];

    if (!tenSP) {
      showSnackBar("failed", "Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!maCategory) {
      showSnackBar("failed", "Vui lòng chọn danh mục");
      return;
    }

    if (!giaNiemYet || giaNiemYet < 0) {
      showSnackBar("failed", "Vui lòng nhập giá niêm yết hợp lệ");
      return;
    }


    const formData = new FormData();
    formData.append("ten_sp", tenSP);
    formData.append("ma_category", maCategory);
    formData.append("gia_niem_yet", giaNiemYet);
    if (giaCoBan !== "") formData.append("gia_co_ban", giaCoBan);
    if (imageFile) {
      formData.append("hinh_anh", imageFile);
    }


    $.ajax({
      url: apiBasePath + "create-product",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#add-product-modal").removeClass("active");
          $("#add-product-form")[0].reset();
          $("#image-preview").hide();
          loadProducts(); // Reload products list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        console.error("Status:", status);
        console.error("Response:", xhr.responseText);
        let errorMessage = "Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.";


        if (xhr.responseText) {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (e) {

          }
        }

        showSnackBar("failed", errorMessage);
      },
    });
  });


  $("#edit-product-form").on("submit", function (e) {
    e.preventDefault();

    const productId = $("#edit-product-id").val();
    const productName = $("#edit-product-name").val().trim();
    const productPrice = $("#edit-product-price").val();
    const imageFile = $("#edit-product-image")[0].files[0];

    if (!productName) {
      showSnackBar("failed", "Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!productPrice || productPrice < 0) {
      showSnackBar("failed", "Vui lòng nhập giá bán hợp lệ");
      return;
    }

    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("ten_sp", productName);
    formData.append("gia_niem_yet", productPrice);
    if (imageFile) {
      formData.append("hinh_anh", imageFile);
    }


    $.ajax({
      url: apiBasePath + "update-product",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#edit-product-modal").removeClass("active");
          $("#edit-product-form")[0].reset();
          loadProducts(); // Reload products list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi cập nhật sản phẩm. Vui lòng thử lại.");
      },
    });
  });


  $("#add-topping-form").on("submit", function (e) {
    e.preventDefault();


    const tenTopping = $("#topping-name").val().trim();
    const giaThem = $("#topping-price").val();
    const imageFile = $("#topping-image")[0].files[0];

    if (!tenTopping) {
      showSnackBar("failed", "Vui lòng nhập tên topping");
      return;
    }

    if (!giaThem || giaThem < 0) {
      showSnackBar("failed", "Vui lòng nhập giá thêm hợp lệ");
      return;
    }


    const formData = new FormData();
    formData.append("ten_topping", tenTopping);
    formData.append("gia_them", giaThem);
    formData.append("hinh_anh", imageFile);


    $.ajax({
      url: apiBasePath + "create-topping",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#add-topping-modal").removeClass("active");
          $("#add-topping-form")[0].reset();
          $("#topping-image-preview").hide();
          loadToppings(); // Reload toppings list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        console.error("Status:", status);
        console.error("Response:", xhr.responseText);
        let errorMessage = "Có lỗi xảy ra khi thêm topping. Vui lòng thử lại.";


        if (xhr.responseText) {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (e) {

          }
        }

        showSnackBar("failed", errorMessage);
      },
    });
  });


  $("#edit-topping-price-form").on("submit", function (e) {
    e.preventDefault();

    const formData = {
      topping_id: $("#edit-topping-id").val(),
      price: $("#edit-topping-price").val(),
    };


    if (!formData.price || formData.price < 0) {
      showSnackBar("failed", "Vui lòng nhập giá thêm hợp lệ");
      return;
    }


    $.ajax({
      url: apiBasePath + "update-topping-price",
      method: "POST",
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#edit-topping-price-modal").removeClass("active");
          loadToppings(); // Reload toppings list
        } else {
          var msg = response.message || "Có lỗi xảy ra";
          var type = msg.indexOf("giá không thay đổi") !== -1 ? "warm" : "failed";
          showSnackBar(type, msg);
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi cập nhật giá topping. Vui lòng thử lại.");
      },
    });
  });


  function loadProducts() {
    $.ajax({
      url: apiBasePath + "products",
      method: "GET",
      dataType: "json",
      success: function (response) {
        if (response.success) {
          renderProducts(response.data);
        } else {
          showSnackBar("failed", response.message || "Không thể tải danh sách sản phẩm");
          $("#products-accordion").html('<div class="empty-state">Không thể tải danh sách sản phẩm</div>');
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading products:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi tải danh sách sản phẩm");
        $("#products-accordion").html('<div class="empty-state">Không thể tải danh sách sản phẩm</div>');
      },
    });
  }

  function loadCategories() {
    const $select = $("#product-category");


    $select.prop("disabled", false);

    $.ajax({
      url: apiBasePath + "categories",
      method: "GET",
      dataType: "json",
      success: function (response) {
        if (response.success) {

          $select.find("option:not(:first)").remove();

          if (response.data && response.data.length > 0) {
            response.data.forEach(function (category) {
              $select.append(
                $("<option></option>")
                  .attr("value", category.MaCategory)
                  .text(category.TenCategory)
              );
            });

            $select.prop("disabled", false).removeAttr("disabled");
          } else {
            console.warn("No categories found");

            if ($select.find("option").length === 1) {
              $select.append(
                $("<option></option>")
                  .attr("value", "")
                  .text("Không có danh mục nào")
                  .prop("disabled", true)
              );
            }
          }
        } else {
          console.error("Failed to load categories:", response.message);

          if ($select.find("option").length === 1) {
            $select.find("option:first").text("-- Lỗi tải danh mục --");
          }
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading categories:", error);

        if ($select.find("option").length === 1) {
          $select.find("option:first").text("-- Lỗi tải danh mục --");
        }
      },
    });
  }

  function renderProducts(products) {
    const $accordion = $("#products-accordion");

    if (products.length === 0) {
      $accordion.html('<div class="empty-state">Chưa có sản phẩm nào</div>');
      return;
    }


    const productsByCategory = {};
    products.forEach(function (product) {
      const categoryName = product.TenCategory || "Khác";
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = [];
      }
      productsByCategory[categoryName].push(product);
    });


    let html = "";
    let accordionIndex = 0;

    Object.keys(productsByCategory)
      .sort()
      .forEach(function (categoryName) {
        const categoryProducts = productsByCategory[categoryName];
        const accordionId = "accordion-" + accordionIndex;
        const isExpanded = accordionIndex === 0 ? "expanded" : ""; // First category expanded by default

        html += '<div class="accordion-item ' + isExpanded + '">';
        html +=
          '<div class="accordion-header" data-accordion="' + accordionId + '">';
        html += '<div class="accordion-title">';
        html +=
          '<span class="category-name">' + escapeHtml(categoryName) + "</span>";
        html +=
          '<span class="product-count">(' +
          categoryProducts.length +
          " sản phẩm)</span>";
        html += "</div>";
        html +=
          '<svg class="accordion-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
        html += '<path d="M6 9l6 6 6-6"/>';
        html += "</svg>";
        html += "</div>";

        html += '<div class="accordion-content" id="' + accordionId + '">';
        html += '<div class="products-table-wrapper">';
        html += '<table class="products-table">';
        html += "<thead>";
        html += "<tr>";
        html += "<th>Mã SP</th>";
        html += "<th>Hình ảnh</th>";
        html += "<th>Tên sản phẩm</th>";
        html += "<th>Giá bán</th>";
        if (isAdmin) {
          html += "<th>Thao tác</th>";
        }
        html += "</tr>";
        html += "</thead>";
        html += "<tbody>";

        categoryProducts.forEach(function (product) {
          const imagePath =
            product.HinhAnh || "assets/img/products/product_one.png";
          const price = formatCurrency(product.GiaNiemYet || product.GiaCoBan);

          html += "<tr>";
          html += "<td>" + product.MaSP + "</td>";
          html +=
            '<td><img src="/' +
            imagePath +
            '" alt="' +
            escapeHtml(product.TenSP) +
            '" class="product-image"></td>';
          html +=
            '<td><div class="product-name">' +
            escapeHtml(product.TenSP) +
            "</div></td>";
          html += '<td><div class="product-price">' + price + "</div></td>";

          if (isAdmin) {
            html += "<td>";
            html += '<div class="action-buttons">';
            html +=
              '<button type="button" class="btn btn-edit btn-edit-product" ' +
              'data-product-id="' +
              product.MaSP +
              '" ' +
              'data-product-name="' +
              escapeHtml(product.TenSP) +
              '" ' +
              'data-product-price="' +
              (product.GiaNiemYet || product.GiaCoBan) +
              '" ' +
              'data-product-image="' +
              escapeHtml(imagePath) +
              '">';
            html +=
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
            html +=
              '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>';
            html +=
              '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
            html += "</svg>";
            html += " Sửa sản phẩm";
            html += "</button>";
            html +=
              '<button type="button" class="btn btn-delete btn-delete-product" ' +
              'data-product-id="' +
              product.MaSP +
              '" ' +
              'data-product-name="' +
              escapeHtml(product.TenSP) +
              '">';
            html +=
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
            html += '<polyline points="3 6 5 6 21 6"/>';
            html +=
              '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
            html += "</svg>";
            html += " Xóa";
            html += "</button>";
            html += "</div>";
            html += "</td>";
          }

          html += "</tr>";
        });

        html += "</tbody>";
        html += "</table>";
        html += "</div>";
        html += "</div>";
        html += "</div>";

        accordionIndex++;
      });

    $accordion.html(html);


    initAccordion();
  }

  function initAccordion() {
    $(".accordion-header")
      .off("click")
      .on("click", function () {
        const accordionId = $(this).data("accordion");
        const $item = $(this).closest(".accordion-item");
        const $content = $("#" + accordionId);


        if ($item.hasClass("expanded")) {
          $item.removeClass("expanded");
          $content.slideUp(300);
        } else {
          $item.addClass("expanded");
          $content.slideDown(300);
        }
      });
  }


  function loadToppings() {
    $.ajax({
      url: apiBasePath + "toppings",
      method: "GET",
      dataType: "json",
      success: function (response) {
        if (response.success) {
          renderToppings(response.data);
        } else {
          showSnackBar("failed", response.message || "Không thể tải danh sách topping");
          $("#toppings-table-wrapper").html('<div class="empty-state">Không thể tải danh sách topping</div>');
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading toppings:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi tải danh sách topping");
        $("#toppings-table-wrapper").html('<div class="empty-state">Không thể tải danh sách topping</div>');
      },
    });
  }

  function renderToppings(toppings) {
    const $wrapper = $("#toppings-table-wrapper");

    if (toppings.length === 0) {
      $wrapper.html('<div class="empty-state">Chưa có topping nào</div>');
      return;
    }


    const defaultToppingImage =
      "assets/img/products/topping/topping-tranchau.png";


    let html = '<div class="products-table-wrapper">';
    html += '<table class="products-table">';
    html += "<thead>";
    html += "<tr>";
    html += "<th>Mã TP</th>";
    html += "<th>Hình ảnh</th>";
    html += "<th>Tên topping</th>";
    html += "<th>Giá thêm</th>";
    if (isAdmin) {
      html += "<th>Thao tác</th>";
    }
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    toppings.forEach(function (topping) {

      const imagePath = topping.HinhAnh || defaultToppingImage;
      const price = formatCurrency(topping.GiaThem);

      html += "<tr>";
      html += "<td>" + topping.MaOptionValue + "</td>";
      html +=
        '<td><img src="/' +
        imagePath +
        '" alt="' +
        escapeHtml(topping.TenGiaTri) +
        '" class="product-image"></td>';
      html +=
        '<td><div class="product-name">' +
        escapeHtml(topping.TenGiaTri) +
        "</div></td>";
      html += '<td><div class="product-price">' + price + "</div></td>";

      if (isAdmin) {
        html += "<td>";
        html += '<div class="action-buttons">';
        html +=
          '<button type="button" class="btn btn-edit btn-edit-topping-price" ' +
          'data-topping-id="' +
          topping.MaOptionValue +
          '" ' +
          'data-topping-name="' +
          escapeHtml(topping.TenGiaTri) +
          '" ' +
          'data-topping-price="' +
          topping.GiaThem +
          '">';
        html +=
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
        html +=
          '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>';
        html +=
          '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
        html += "</svg>";
        html += " Sửa giá";
        html += "</button>";
        html +=
          '<button type="button" class="btn btn-delete btn-delete-topping" ' +
          'data-topping-id="' +
          topping.MaOptionValue +
          '" ' +
          'data-topping-name="' +
          escapeHtml(topping.TenGiaTri) +
          '">';
        html +=
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
        html += '<polyline points="3 6 5 6 21 6"/>';
        html +=
          '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
        html += "</svg>";
        html += " Xóa";
        html += "</button>";
        html += "</div>";
        html += "</td>";
      }

      html += "</tr>";
    });

    html += "</tbody>";
    html += "</table>";
    html += "</div>";

    $wrapper.html(html);
  }



  function updateImagePreview($input, $preview, $image) {
    const file = $input[0].files[0];
    const currentSrc = $input.data("current-src");

    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        $image.attr("src", event.target.result);
        $preview.show();
      };
      reader.readAsDataURL(file);
      return;
    }

    if (currentSrc) {
      $image.attr("src", currentSrc);
      $preview.show();
      return;
    }

    $preview.hide();
  }

  function resolveImageSrc(imagePath) {
    const normalizedPath = imagePath || "assets/img/products/product_one.png";
    if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    return "/" + normalizedPath.replace(/^\/+/, "");
  }

  function formatCurrency(amount) {
    return formatCurrencyWithStyle(amount);
  }
});
