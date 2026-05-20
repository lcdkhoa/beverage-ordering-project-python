$(document).ready(function() {

    loadMyOrders(1);


    let searchTimeout;
    $('#myOrderSearchInput').on('input', function() {
        const searchValue = $(this).val().trim();
        

        if (searchValue) {
            $('#clearMySearchBtn').show();
        } else {
            $('#clearMySearchBtn').hide();
        }


        clearTimeout(searchTimeout);
        

        searchTimeout = setTimeout(function() {
            loadMyOrders(1);
        }, 300);
    });


    $('#myOrderSearchInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            e.preventDefault();
            clearTimeout(searchTimeout);
            loadMyOrders(1);
        }
    });


    $('#clearMySearchBtn').on('click', function() {
        $('#myOrderSearchInput').val('');
        $(this).hide();
        loadMyOrders(1);
    });


    $('#myOrderStatusFilter, #myOrderDaysFilter').on('change', function() {
        loadMyOrders(1);
    });


    $('#myOrderDetailModal .order-detail-overlay, #myOrderDetailModal .order-detail-close').on('click', function() {
        $('#myOrderDetailModal').hide();
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#myOrderDetailModal').is(':visible')) {
            $('#myOrderDetailModal').hide();
        }
    });


    function loadMyOrders(page) {
        page = page || 1;
        var $loading = $('#myOrdersLoading');
        var $empty = $('#myOrdersEmpty');
        var $list = $('#myOrdersList');
        var $pagination = $('#myOrdersPagination');

        $loading.show();
        $empty.hide();
        $list.hide();
        $pagination.hide();

        var params = {
            page: page,
            per_page: 10,
            status: $('#myOrderStatusFilter').val() || '',
            days: $('#myOrderDaysFilter').val() || 30,
            search: $('#myOrderSearchInput').val().trim() || ''
        };

        $.ajax({
            url: '/api/order/get',
            method: 'GET',
            data: params,
            dataType: 'json',
            success: function(res) {
                $loading.hide();
                if (res.success && res.orders && res.orders.length > 0) {
                    renderMyOrders(res.orders);
                    renderMyOrdersPagination(res);
                    $list.show();
                    if (res.total_pages > 1) {
                        $pagination.show();
                    }
                } else {
                    if (res.success === false && res.message) {
                        showSnackBar('failed', res.message);
                    }
                    var searchValue = $('#myOrderSearchInput').val().trim();
                    if (searchValue) {
                        $empty.find('p').first().text('Không tìm thấy đơn hàng có mã "' + searchValue + '"');
                    } else {
                        $empty.find('p').first().text('Bạn chưa có đơn hàng nào');
                    }
                    $empty.show();
                }
            },
            error: function(xhr, status, err) {
                console.error('Load my orders error:', err);
                showSnackBar('failed', 'Có lỗi xảy ra khi tải đơn hàng. Vui lòng thử lại.');
                $loading.hide();
                $empty.show();
            }
        });
    }


    function renderMyOrders(orders) {
        var $list = $('#myOrdersList');
        $list.empty();
        orders.forEach(function(o) {
            var dateTime = (o.NgayTaoFormatted || '') + ' | ' + (o.NgayTaoTime || '');
            var statusClass = getStatusClass(o.TrangThai);
            var statusText = getStatusText(o.TrangThai);
            var card = $('<div class="order-card order-card-compact">')
                .append(
                    '<div class="order-card-header">' +
                    '<span class="order-status-badge status-' + statusClass + '">' + escapeHtml(statusText) + '</span>' +
                    '</div>' +
                    '<div class="order-card-body">' +
                    '<h3 class="order-card-code">Mã đơn ' + escapeHtml(o.OrderCode) + '</h3>' +
                    '<p class="order-card-date">' + escapeHtml(dateTime) + '</p>' +
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
            openMyOrderDetail(parseInt($(this).data('order-id'), 10));
        });
    }


    function renderMyOrdersPagination(res) {
        var total = res.total || 0;
        var totalPages = res.total_pages || 1;
        var page = res.page || 1;
        var $p = $('#myOrdersPagination');
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
            if (p >= 1 && p <= totalPages) loadMyOrders(p);
        });
    }


    function openMyOrderDetail(orderId) {
        var $modal = $('#myOrderDetailModal');
        var $body = $('#myOrderDetailBody');
        $body.html('<div class="order-detail-loading">Đang tải...</div>');
        $modal.show();

        $.ajax({
            url: '/order-detail-view',
            method: 'GET',
            data: { id: orderId },
            success: function(html) {
                $body.html(html);

                initCollapsibleSections();
            },
            error: function() {
                showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
                $body.html('<p class="order-detail-error">Có lỗi xảy ra. Vui lòng thử lại.</p>');
            }
        });
    }


    function initCollapsibleSections() {
        $('#myOrderDetailBody').off('click', '.order-detail-section.collapsible .order-detail-section-title');
        $('#myOrderDetailBody').on('click', '.order-detail-section.collapsible .order-detail-section-title', function() {
            var $section = $(this).closest('.order-detail-section');
            $section.toggleClass('collapsed');
        });
    }

    function getStatusClass(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'completed';
        if (s === 'cancelled' || s === 'store_cancelled') return 'cancelled';
        if (s === 'delivering') return 'delivering';
        if (s === 'processing' || s === 'order_received') return 'received';
        if (s === 'payment_received' || s === 'pending') return 'payment-received';
        return 'payment-received';
    }

    function getStatusText(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'Hoàn thành';
        if (s === 'cancelled' || s === 'store_cancelled') return 'Hủy đơn';
        if (s === 'delivering') return 'Đang vận chuyển';
        if (s === 'processing' || s === 'order_received') return 'Đã nhận đơn';
        if (s === 'payment_received' || s === 'pending') return 'Đã nhận thanh toán';
        return 'Đã nhận thanh toán';
    }
});
