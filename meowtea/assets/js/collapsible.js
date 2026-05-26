/**
 * Reusable collapsible section component.
 * Usage:
 *   $container.html(buildCollapsibleSection({ title, subtitle, bodyHtml }));
 *   initCollapsibles($container);
 */

function buildCollapsibleSection(options) {
  const settings = options || {};
  const collapsed = settings.collapsed !== false;
  const collapsedClass = collapsed ? " collapsed" : "";
  const sectionId = settings.id ? ' data-collapsible-id="' + escapeHtml(String(settings.id)) + '"' : "";
  const extraClass = settings.extraClass || "";
  const actionsHtml = settings.actionsHtml || "";
  const bodyHtml = settings.bodyHtml || "";
  const title = settings.title || "";
  const subtitle = settings.subtitle || "";

  return (
    '<div class="ui-collapsible' +
    collapsedClass +
    " " +
    extraClass +
    '"' +
    sectionId +
    ">" +
    '<div class="ui-collapsible-header" role="button" tabindex="0" aria-expanded="' +
    (!collapsed) +
    '">' +
    '<span class="ui-collapsible-header-main">' +
    '<span class="ui-collapsible-title">' +
    escapeHtml(title) +
    "</span>" +
    (subtitle
      ? '<span class="ui-collapsible-subtitle">' + escapeHtml(subtitle) + "</span>"
      : "") +
    "</span>" +
    (actionsHtml ? '<span class="ui-collapsible-header-actions">' + actionsHtml + "</span>" : "") +
    '<svg class="ui-collapsible-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M6 9l6 6 6-6"/>' +
    "</svg>" +
    "</div>" +
    '<div class="ui-collapsible-body">' +
    '<div class="ui-collapsible-body-inner">' +
    bodyHtml +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function initCollapsibles($root) {
  const $scope = $root && $root.length ? $root : $(document);

  $scope.find(".ui-collapsible-header").off("click.collapsible").on("click.collapsible", function (event) {
    if ($(event.target).closest(".ui-collapsible-action").length) {
      return;
    }

    const $section = $(this).closest(".ui-collapsible");
    const isCollapsed = $section.toggleClass("collapsed").hasClass("collapsed");
    $(this).attr("aria-expanded", !isCollapsed);
  });

  $scope.find(".ui-collapsible-header").off("keydown.collapsible").on("keydown.collapsible", function (event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    $(this).trigger("click.collapsible");
  });
}

function setCollapsibleSubtitle($section, subtitle) {
  if (!$section || !$section.length) {
    return;
  }
  $section.find(".ui-collapsible-subtitle").text(subtitle);
}

function updateOptionGroupCount($container, groupId) {
  const $section = $container.find('.ui-collapsible[data-group-id="' + groupId + '"]');
  if (!$section.length) {
    return;
  }

  const $items = $container.find('.option-chip-item[data-group-id="' + groupId + '"]');
  const total = $items.length;
  const selected = $items.find('input[type="checkbox"]:checked').length;
  setCollapsibleSubtitle($section, selected + "/" + total + " đã chọn");
}
