$(document).ready(function() {

    loadManageOrders(1);
    loadUserFilter();


    let searchTimeout;
    $('#manageOrderSearchInput').on('input', function() {
        const searchValue = $(this).val().trim();
        

        if (searchValue) {
            $('#clearSearchBtn').show();
        } else {
            $('#clearSearchBtn').hide();
        }


        clearTimeout(searchTimeout);
        

        searchTimeout = setTimeout(function() {
            loadManageOrders(1);
        }, 300);
    });


    $('#manageOrderSearchInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            clearTimeout(searchTimeout);
            loadManageOrders(1);
        }
    });


    $('#clearSearchBtn').on('click', function() {
        $('#manageOrderSearchInput').val('');
        $(this).hide();
        loadManageOrders(1);
    });


    $('#manageOrderUserFilter, #manageOrderStatusFilter, #manageOrderDaysFilter').on('change', function() {
        loadManageOrders(1);
    });


    $('#manageOrderDetailModal .order-detail-overlay, #manageOrderDetailModal .order-detail-close').on('click', function() {
        $('#manageOrderDetailModal').hide();
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#manageOrderDetailModal').is(':visible')) {
            $('#manageOrderDetailModal').hide();
        }
    });


    function loadUserFilter() {
        $.ajax({
            url: '/api/auth/get-users',
            method: 'GET',
            dataType: 'json',
            success: function(res) {
                const users = res.users || res.data || [];
                if (res.success && users) {
                    var $select = $('#manageOrderUserFilter');

                    $select.find('option:not(:first)').remove();
                    users.forEach(function(user) {
                        var userName = (user.Ho + ' ' + user.Ten).trim() || user.Username;
                        $select.append('<option value="' + user.MaUser + '">' + escapeHtml(userName) + ' (@' + escapeHtml(user.Username) + ')</option>');
                    });
                }
            },
            error: function() {
                console.error('Failed to load user filter');
            }
        });
    }


    function loadManageOrders(page) {
        page = page || 1;
        var $loading = $('#manageOrdersLoading');
        var $empty = $('#manageOrdersEmpty');
        var $list = $('#manageOrdersList');
        var $pagination = $('#manageOrdersPagination');

        $loading.show();
        $empty.hide();
        $list.hide();
        $pagination.hide();

        var params = {
            page: page,
            per_page: 10,
            user_id: $('#manageOrderUserFilter').val() || '',
            status: $('#manageOrderStatusFilter').val() || '',
            days: $('#manageOrderDaysFilter').val() || 30,
            search: $('#manageOrderSearchInput').val().trim() || ''
        };

        $.ajax({
            url: '/api/order/get-all',
            method: 'GET',
            data: params,
            dataType: 'json',
            success: function(res) {
                $loading.hide();
                if (res.success && res.orders && res.orders.length > 0) {
                    renderManageOrders(res.orders);
                    renderManageOrdersPagination(res);
                    $list.show();
                    if (res.total_pages > 1) {
                        $pagination.show();
                    }
                } else {

                    var searchValue = $('#manageOrderSearchInput').val().trim();
                    if (searchValue) {
                        $empty.find('p').text('Không tìm thấy đơn hàng có mã "' + searchValue + '"');
                    } else {
                        $empty.find('p').text('Không có đơn hàng nào');
                    }
                    $empty.show();
                }
            },
            error: function(xhr, status, err) {
                console.error('Load manage orders error:', err);
                $loading.hide();
                $empty.show();
            }
        });
    }


    function renderManageOrders(orders) {
        var $list = $('#manageOrdersList');
        $list.empty();
        orders.forEach(function(o) {
            var dateTime = (o.NgayTaoFormatted || '') + ' | ' + (o.NgayTaoTime || '');
            var statusClass = getManageStatusClass(o.TrangThai);
            var statusText = getManageStatusText(o.TrangThai);
            var card = $('<div class="order-card order-card-compact">')
                .append(
                    '<div class="order-card-header">' +
                    '<span class="order-status-badge status-' + statusClass + '">' + escapeHtml(statusText) + '</span>' +
                    '</div>' +
                    '<div class="order-card-body">' +
                    '<h3 class="order-card-code">Mã đơn ' + escapeHtml(o.OrderCode) + '</h3>' +
                    '<p class="order-card-date">' + escapeHtml(dateTime) + '</p>' +
                    '<p class="order-card-store">Khách hàng: ' + escapeHtml(o.CustomerName) + '</p>' +
                    '<p class="order-card-store">Cửa hàng: ' + escapeHtml(o.TenStore) + '</p>' +
                    '<p class="order-card-qty">Số lượng: ' + (o.ItemCount || 0) + ' Sản phẩm</p>' +
                    '<div class="order-card-footer">' +
                    '<a href="#" class="order-card-detail-link" data-order-id="' + o.MaOrder + '">Xem chi tiết</a>' +
                    '<span class="order-card-total">Tổng tiền: ' + formatCurrency(o.TongTien) + '</span>' +
                    '</div>' +
                    '</div>'
                );
            $list.append(card);
        });
        $list.find('.order-card-detail-link').on('click', function(e) {
            e.preventDefault();
            openManageOrderDetail(parseInt($(this).data('order-id'), 10));
        });
    }


    function renderManageOrdersPagination(res) {
        var total = res.total || 0;
        var totalPages = res.total_pages || 1;
        var page = res.page || 1;
        var $p = $('#manageOrdersPagination');
        $p.empty();
        if (totalPages <= 1) return;

        var start = Math.max(1, page - 2);
        var end = Math.min(totalPages, page + 2);
        var nums = '';
        for (var i = start; i <= end; i++) {
            nums += '<button type="button" class="pagination-number' + (i === page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        var html = '<div class="orders-pagination-inner">' +
            '<p class="pagination-info">Trang ' + page + ' trên ' + totalPages + '</p>' +
            '<div class="pagination-controls">' +
            '<button type="button" class="pagination-arrow" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>&lt;</button>' +
            '<div class="pagination-numbers">' + nums + '</div>' +
            '<button type="button" class="pagination-arrow" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>&gt;</button>' +
            '</div>' +
            '</div>';
        $p.html(html);
        $p.find('.pagination-number, .pagination-arrow').on('click', function() {
            var p = parseInt($(this).data('page'), 10);
            if (p >= 1 && p <= totalPages) loadManageOrders(p);
        });
    }


    function openManageOrderDetail(orderId) {
        var $modal = $('#manageOrderDetailModal');
        var $body = $('#manageOrderDetailBody');
        $body.html('<div class="order-detail-loading">Đang tải...</div>');
        $modal.show();

        $.ajax({
            url: '/api/order/get-one-admin',
            method: 'GET',
            data: { id: orderId },
            dataType: 'json',
            success: function(res) {
                if (res.success && res.order) {
                    $body.html(renderManageOrderDetail(res.order));
                    

                    initCollapsibleSections();
                    

                    $('#acceptOrderBtn').on('click', function() {
                        updateOrderStatus(orderId, 'accept');
                    });
                    $('#cancelOrderBtn').on('click', function() {
                        if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                            updateOrderStatus(orderId, 'cancel');
                        }
                    });
                } else {
                    showSnackBar('failed', res.message || 'Không tải được đơn hàng.');
                    $body.html('<p class="order-detail-error">Không tải được đơn hàng.</p>');
                }
            },
            error: function() {
                showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
                $body.html('<p class="order-detail-error">Có lỗi xảy ra. Vui lòng thử lại.</p>');
            }
        });
    }


    function initCollapsibleSections() {
        $('#manageOrderDetailBody').off('click', '.order-detail-section.collapsible .order-detail-section-title');
        $('#manageOrderDetailBody').on('click', '.order-detail-section.collapsible .order-detail-section-title', function() {
            var $section = $(this).closest('.order-detail-section');
            $section.toggleClass('collapsed');
        });
    }


    function renderManageOrderDetail(o) {
        var statusClass = getManageStatusClass(o.TrangThai);
        var statusText = getManageStatusText(o.TrangThai);
        var basePath = '../../';
        
        var sect1 = '<div class="order-detail-section collapsible">' +
            '<h3 class="order-detail-section-title">Thông tin đơn hàng</h3>' +
            '<div class="order-detail-section-content">' +
            '<div class="order-detail-info-grid">' +
            '<div class="info-item"><span class="info-label">Mã đơn hàng:</span> <span class="info-value">' + escapeHtml(o.OrderCode) + '</span></div>' +
            '<div class="info-item"><span class="info-label">Khách hàng:</span> <span class="info-value">' + escapeHtml(o.CustomerName) + '</span></div>' +
            '<div class="info-item"><span class="info-label">Thời gian đặt hàng:</span> <span class="info-value">' + escapeHtml(o.NgayTaoFormatted) + '</span></div>' +
            '<div class="info-item"><span class="info-label">Trạng thái:</span> <span class="order-detail-status status-' + statusClass + '">' + escapeHtml(statusText) + '</span></div>' +
            '<div class="info-item"><span class="info-label">Hình thức thanh toán:</span> <span class="info-value">' + escapeHtml(o.PaymentMethod) + '</span></div>' +
            '</div></div></div>';

        var sect2 = '<div class="order-detail-section collapsible collapsed">' +
            '<h3 class="order-detail-section-title">Thông tin nhận hàng</h3>' +
            '<div class="order-detail-section-content">' +
            '<div class="order-detail-info-grid">' +
            '<div class="info-item"><span class="info-label">Họ và tên:</span> <span class="info-value">' + escapeHtml(o.NguoiNhan || '') + '</span></div>' +
            '<div class="info-item"><span class="info-label">Số điện thoại:</span> <span class="info-value">' + escapeHtml(o.DienThoaiGiao || '') + '</span></div>' +
            '<div class="info-item full"><span class="info-label">Địa chỉ nhận hàng:</span> <span class="info-value">' + escapeHtml(o.DiaChiGiao || '') + '</span></div>' +
            '</div></div></div>';

        var productsHtml = '';
        if (o.items && o.items.length > 0) {
            o.items.forEach(function(it) {
                var img = (it.HinhAnh && it.HinhAnh.indexOf('http') !== 0) ? (basePath + (it.HinhAnh || 'assets/img/products/product_one.png')) : (it.HinhAnh || (basePath + 'assets/img/products/product_one.png'));
                var opts = [];
                if (it.options && it.options.length) {
                    it.options.forEach(function(opt) {
                        var t = (parseFloat(opt.GiaThem) || 0) > 0 ? '+ ' + (opt.TenGiaTri || '') : (opt.TenGiaTri || '');
                        opts.push(escapeHtml(t));
                    });
                }
                var optsStr = opts.length ? '<div class="order-detail-item-options">' + opts.join(', ') + '</div>' : '';
                
                var giaHienTai = parseFloat(it.GiaCoBan);
                if (it.options && it.options.length) {
                    it.options.forEach(function(opt) {
                        giaHienTai += parseFloat(opt.GiaThem || 0);
                    });
                }
                
                productsHtml += '<div class="order-detail-product">' +
                    '<div class="order-detail-product-img"><img src="' + escapeHtml(img) + '" alt=""></div>' +
                    '<div class="order-detail-product-info">' +
                    '<p class="order-detail-product-name">x' + (it.SoLuong || 1) + ' ' + escapeHtml(it.TenSP || '') + '</p>' +
                    optsStr +
                    '<div class="order-detail-product-price">' +
                    '<span class="order-detail-item-current-price">' + formatCurrency(giaHienTai) + '</span>' +
                    '</div></div></div>';
            });
        }
        var sect3 = '<div class="order-detail-section collapsible collapsed">' +
            '<h3 class="order-detail-section-title">Sản phẩm (' + (o.items ? o.items.length : 0) + ')</h3>' +
            '<div class="order-detail-section-content">' +
            '<div class="order-detail-products">' + (productsHtml || '<p>Không có sản phẩm</p>') + '</div></div></div>';

        var sect4 = '<div class="order-detail-section">' +
            '<h3 class="order-detail-section-title">Số tiền thanh toán</h3>' +
            '<div class="order-detail-summary">' +
            '<div class="order-detail-summary-row"><span class="info-label">Tạm tính:</span> <span class="info-value">' + formatCurrency(o.Subtotal || 0) + '</span></div>' +
            '<div class="order-detail-summary-row"><span class="info-label">Phí vận chuyển:</span> <span class="info-value">' + formatCurrency(o.PhiVanChuyen || 0) + '</span></div>' +
            '<div class="order-detail-summary-row"><span class="info-label">Khuyến mãi:</span> <span class="info-value">' + ((o.GiamGia || 0) > 0 ? '-' : '') + formatCurrency(o.GiamGia || 0) + '</span></div>' +
            '<div class="order-detail-summary-row total"><span class="info-label">Số tiền thanh toán:</span> <span class="info-value">' + formatCurrency(o.TongTien || 0) + '</span></div>' +
            '</div></div>';


        var actionsHtml = '';
        var currentStatus = (o.TrangThai || '').toLowerCase();
        if (currentStatus === 'payment_received' || currentStatus === 'pending') {
            actionsHtml = '<div class="order-detail-section">' +
                '<h3 class="order-detail-section-title">Thao tác</h3>' +
                '<div class="order-detail-actions" style="display: flex; gap: 12px; justify-content: flex-end;">' +
                '<button type="button" id="acceptOrderBtn" class="login-btn" style="background: var(--primary-green);">Chấp nhận đơn</button>' +
                '<button type="button" id="cancelOrderBtn" class="login-btn" style="background: #dc3545;">Hủy đơn</button>' +
                '</div></div>';
        }

        return sect1 + sect2 + sect3 + sect4 + actionsHtml;
    }


    function updateOrderStatus(orderId, action) {
        $.ajax({
            url: '/api/order/update-status',
            method: 'POST',
            data: { order_id: orderId, action: action },
            dataType: 'json',
            success: function(res) {
                if (res.success) {
                    showSnackBar('success', res.message || 'Cập nhật trạng thái thành công!');
                    $('#manageOrderDetailModal').hide();
                    loadManageOrders(1);
                } else {
                    var msg = res.message || 'Cập nhật trạng thái thất bại!';
                    var type = (msg.indexOf('Chỉ có thể') !== -1) ? 'warm' : 'failed';
                    showSnackBar(type, msg);
                }
            },
            error: function() {
                showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
        });
    }

    function getManageStatusClass(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'completed';
        if (s === 'cancelled' || s === 'store_cancelled') return 'cancelled';
        if (s === 'delivering') return 'delivering';
        if (s === 'processing' || s === 'order_received') return 'received';
        if (s === 'payment_received' || s === 'pending') return 'payment-received';
        return 'payment-received';
    }

    function getManageStatusText(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'Hoàn thành';
        if (s === 'cancelled' || s === 'store_cancelled') return 'Hủy đơn';
        if (s === 'delivering') return 'Đang vận chuyển';
        if (s === 'processing' || s === 'order_received') return 'Đã nhận đơn';
        if (s === 'payment_received' || s === 'pending') return 'Đã nhận thanh toán';
        return 'Đã nhận thanh toán';
    }
});
