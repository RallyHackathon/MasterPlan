Ext.define('PlanningColumnDropController', {
    extend: 'Rally.ui.cardboard.plugin.ColumnDropController',
    alias: 'plugin.planningcolumndropcontroller',
    _addDragZone: function() {
        var column = this.cmp;
        Ext.create('Ext.dd.DragZone', this.getDndContainer(), {

            ddGroup: column.ddGroup,

            onBeforeDrag: function(data, e) {
                var avatar = Ext.fly(this.dragElId);
                avatar.setWidth(data.targetWidth);
                column.fireEvent('cardpickedup', data.card);
            },

            proxy: Ext.create('Ext.dd.StatusProxy', {
                animRepair: true,
                shadow: false,
                dropAllowed: "cardboard",
                dropNotAllowed: "cardboard"
            }),

            getDragData: function(e) {
                var dragEl = e.getTarget('.drag-handle', 10);
                if (dragEl) {
                    var sourceEl = e.getTarget('.rui-card', 10);
                    var avatar = sourceEl.cloneNode(true);
                    avatar.id = Ext.id();
                    return {
                        targetWidth: Ext.fly(sourceEl).getWidth(),
                        ddel: avatar,
                        sourceEl: sourceEl,
                        repairXY: Ext.fly(sourceEl).getXY(),
                        card: Ext.ComponentManager.get(sourceEl.id),
                        column: column
                    };
                }
            },

            getRepairXY: function() {
                return this.dragData.repairXY;
            }
        });
    }
});